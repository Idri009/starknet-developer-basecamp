use contracts::Counter::ICounterDispatcherTrait;
use starknet::ContractAddress;
use snforge_std::{declare, ContractClassTrait, DeclareResultTrait, spy_events, start_cheat_caller_address, stop_cheat_caller_address, EventSpyAssertionsTrait, set_balance, Token};
use contracts::Counter::{ICounterDispatcher};
use contracts::Counter::CounterContract::{CounterChanged, ChangeReason, Event};
use contracts::utils::{ strk_address, strk_to_fri };
use openzeppelin_token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};


fn owner_address() -> ContractAddress {
    'owner'.try_into().unwrap()
}

fn user_address() -> ContractAddress {
    'caller'.try_into().unwrap()
}

fn deploy_counter(init_count: u32) -> ICounterDispatcher {
    let contract = declare("CounterContract").unwrap().contract_class();
    let owner_address: ContractAddress = 'owner'.try_into().unwrap();
    let mut constructor_args = array![];

    init_count.serialize(ref constructor_args);
    owner_address.serialize(ref constructor_args);

    let (contract_address, _) = contract.deploy(@constructor_args).unwrap();
    ICounterDispatcher{ contract_address }
}

#[test]
fn test_contract_initialization() {
    let dispatcher = deploy_counter(5);

    let count = dispatcher.get_counter();
    let expected_count: u32 = 5;
    assert!(count == expected_count, "Initialization of contract failed");

}

#[test]
fn test_increment() {
    let init_count: u32 = 0;
    let dispatcher = deploy_counter(init_count);
    let mut spy = spy_events();

    start_cheat_caller_address(dispatcher.contract_address, user_address());
    dispatcher.increment();
    stop_cheat_caller_address(dispatcher.contract_address);
    let current_count = dispatcher.get_counter();
    let expected_count: u32 = 1;
    assert!(current_count == expected_count, "Increment failed");

    let expected_event = CounterChanged {
        caller: user_address(),
        old_count: 0,
        new_count: expected_count,
        reason: ChangeReason::Incremented,
    };

    spy.assert_emitted(@array![(
        dispatcher.contract_address,
        Event::CounterChanged(expected_event),
    )]);
}

#[test]
fn test_decrement_success() {
    let init_count: u32 = 4;
    let dispatcher = deploy_counter(init_count);
    let mut spy = spy_events();

    start_cheat_caller_address(dispatcher.contract_address, user_address());
    dispatcher.decrement();
    stop_cheat_caller_address(dispatcher.contract_address);
    let current_count = dispatcher.get_counter();
    let expected_count: u32 = 3;
    assert!(current_count == expected_count, "Decrement failed");

    let expected_event = CounterChanged {
        caller: user_address(),
        old_count: 4,
        new_count: expected_count,
        reason: ChangeReason::Decremented,
    };

    spy.assert_emitted(@array![(
        dispatcher.contract_address,
        Event::CounterChanged(expected_event),
    )]);
}

#[test]
#[should_panic(expected: "Count cannot be negative")]
fn test_decrement_fail() {
    let init_count: u32 = 0;
    let dispatcher = deploy_counter(init_count);

    dispatcher.decrement();
    dispatcher.get_counter();
}

#[test]
fn test_set_counter_owner() {
    let init_count: u32 = 8;
    let new_count: u32 = 15;
    let dispatcher = deploy_counter(init_count);
    let mut spy = spy_events();

    start_cheat_caller_address(dispatcher.contract_address, owner_address());
    dispatcher.set_counter(new_count);
    stop_cheat_caller_address(dispatcher.contract_address);
    let current_count = dispatcher.get_counter();
    assert!(current_count == new_count, "The owner is unable to set the counter");

    let expected_event = CounterChanged {
        caller: owner_address(),
        old_count: init_count,
        new_count,
        reason: ChangeReason::Set,
    };

    spy.assert_emitted(@array![(
        dispatcher.contract_address,
        Event::CounterChanged(expected_event),
    )]);
}

#[test]
#[should_panic]
fn test_set_counter_non_owner() {
    let init_count: u32 = 8;
    let new_count: u32 = 15;

    let dispatcher = deploy_counter(init_count);

    start_cheat_caller_address(dispatcher.contract_address, user_address());
    dispatcher.set_counter(new_count);
    stop_cheat_caller_address(dispatcher.contract_address);

    dispatcher.get_counter();
}

#[test]
#[should_panic(expected: "Insufficient STRK balance to reset counter")]
fn test_reset_counter_insufficient_balance() {
    let init_count: u32 = 8;
    let dispatcher = deploy_counter(init_count);

    start_cheat_caller_address(dispatcher.contract_address, user_address());
    dispatcher.reset_counter();
}

#[test]
#[should_panic(expected: "Insufficient STRK allowance to reset counter")]
fn test_reset_counter_insufficient_allowance() {
    let init_count: u32 = 8;
    let dispatcher = deploy_counter(init_count);

    let caller = user_address();
    set_balance(caller, strk_to_fri(1), Token::STRK);

    start_cheat_caller_address(dispatcher.contract_address, caller);
    dispatcher.reset_counter();
}

#[test]
fn test_reset_counter_success() {
    let init_count: u32 = 8;
    let counter = deploy_counter(init_count);    
    let mut spy = spy_events();
    let caller = user_address();
    set_balance(caller, strk_to_fri(10), Token::STRK);

    let erc20 = IERC20Dispatcher { contract_address: strk_address() };

    start_cheat_caller_address(erc20.contract_address, caller);
    erc20.approve(counter.contract_address, strk_to_fri(5));
    stop_cheat_caller_address(erc20.contract_address);

    start_cheat_caller_address(counter.contract_address, caller);
    counter.reset_counter();
    stop_cheat_caller_address(counter.contract_address);

    assert!(counter.get_counter() == 0, "Resetting counter failed");

    let expected_event = CounterChanged {
        caller,
        old_count: init_count,
        new_count: 0,
        reason: ChangeReason::Reset,
    };

    spy.assert_emitted(@array![(
        counter.contract_address,
        Event::CounterChanged(expected_event),
    )]);

    assert!(erc20.balance_of(caller) == strk_to_fri(9), "STRK balance should decrease after reset");
    assert!(erc20.balance_of(owner_address()) == strk_to_fri(1), "STRK balance of owner should increase after reset");
}
