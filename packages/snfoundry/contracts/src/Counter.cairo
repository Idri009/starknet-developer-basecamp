#[starknet::interface]
pub trait ICounter<T> {
    fn get_counter(self: @T) -> u32;
    fn increment(ref self: T);
    fn decrement(ref self: T);
    fn set_counter(ref self: T, new_count: u32);
    fn reset_counter(ref self: T);
}

#[starknet::contract]
pub mod CounterContract {
    use OwnableComponent::InternalTrait;
    use super::ICounter;
    use starknet::{get_caller_address, ContractAddress, get_contract_address};
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use openzeppelin_access::ownable::OwnableComponent;
    use openzeppelin_token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
    use contracts::utils::{ strk_address, strk_to_fri };

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);


    #[abi(embed_v0)]
    impl OwnableImpl = OwnableComponent::OwnableImpl<ContractState>;
    impl InternalImpl = OwnableComponent::InternalImpl<ContractState>;

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        CounterChanged: CounterChanged,
        #[flat]
        OwnableEvent: OwnableComponent::Event
    }

    #[derive(Drop, starknet::Event)]
    pub struct CounterChanged {
        pub old_count: u32,
        pub new_count: u32,
        pub caller: ContractAddress,
        pub reason: ChangeReason,
    }

    #[derive(Drop, Copy, Serde)]
    pub enum ChangeReason {
        Incremented,
        Decremented,
        Set,
        Reset,
    }
    
    #[storage]
    struct Storage {
        count: u32,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
    }

    #[constructor]
    fn constructor(ref self: ContractState, init_value: u32, owner: ContractAddress) {
        self.count.write(init_value);
        self.ownable.initializer(owner);
    }

    #[abi (embed_v0)]
    impl CounterImpl of ICounter<ContractState> {
        fn get_counter(self: @ContractState) -> u32 {
            self.count.read()
        }

        fn increment(ref self: ContractState) {
            let current_count = self.count.read();
            let new_count = current_count + 1;
            self.count.write(new_count);

            let caller = get_caller_address();
            let event: CounterChanged = CounterChanged {
                caller,
                old_count: current_count,
                new_count,
                reason: ChangeReason::Incremented,
            };

            self.emit(event);
        }

        fn decrement(ref self: ContractState) {
            let current_count = self.count.read();
            assert!(current_count > 0, "Count cannot be negative");
            let new_count = current_count - 1;
            self.count.write(new_count);

            let caller = get_caller_address();
            let event: CounterChanged = CounterChanged {
                caller,
                old_count: current_count,
                new_count,
                reason: ChangeReason::Decremented,
            };
            self.emit(event);
        }

        fn set_counter(ref self: ContractState, new_count: u32) {
            self.ownable.assert_only_owner();
            let current_count = self.count.read();
            self.count.write(new_count);

            let event: CounterChanged = CounterChanged {
                caller: get_caller_address(),
                old_count: current_count,
                new_count,
                reason: ChangeReason::Set,
            };
            self.emit(event);
        }

        fn reset_counter(ref self: ContractState) {
            let payment_amount: u256 = strk_to_fri(1);
            let strk_token_address: ContractAddress = strk_address();

            let caller = get_caller_address();
            let contract_address = get_contract_address();
            let dispatcher = IERC20Dispatcher { contract_address: strk_token_address };

            let balance = dispatcher.balance_of(caller);
            assert!(balance >= payment_amount, "Insufficient STRK balance to reset counter");

            let allowance = dispatcher.allowance(caller, contract_address);
            assert!(allowance >= payment_amount, "Insufficient STRK allowance to reset counter");

            let owner = self.ownable.owner();
            let success = dispatcher.transfer_from(caller, owner, payment_amount);
            assert!(success, "STRK transfer failed");

            let current_count = self.count.read();
            self.count.write(0);

            let event: CounterChanged = CounterChanged {
                caller,
                old_count: current_count,
                new_count: 0,
                reason: ChangeReason::Reset,
            };
            self.emit(event);
        }
    }
}