"use client";
import { ConnectedAddress } from "~~/components/ConnectedAddress";
import { CounterValue } from "~~/components/CounterValue";
import { IncrementCounterButton } from "~~/components/IncrementCounterButton";
import { DecrementCounterButton } from "~~/components/DecrementCounterButton";
import { SetCounterButton } from "~~/components/SetCounterButton";
import { CounterChangedEvents } from "~~/components/CounterChangedEvents";
import { ResetCounterButton } from "~~/components/ResetCounterButton";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";
import { useAccount } from "~~/hooks/useAccount";

const Home = () => {
  const { data, isLoading, error } = useScaffoldReadContract({
    contractName: "CounterContract",
    functionName: "get_counter",
  });
  const { data: ownerData } = useScaffoldReadContract({
    contractName: "CounterContract",
    functionName: "owner",
  });
  const { address: connectedAddress } = useAccount();

  const normalizeAddress = (val: any): string | null => {
    if (val == null) return null;
    if (Array.isArray(val) && val.length === 1) return normalizeAddress(val[0]);
    if (typeof val === "string") return val.toLowerCase();
    if (typeof val === "bigint") return ("0x" + val.toString(16)).toLowerCase();
    return null;
  };
  const stripLeadingZeros = (hex: string | null) =>
    hex ? hex.replace(/^0x0+/, "0x").toLowerCase() : null;

  const ownerNormalized = stripLeadingZeros(normalizeAddress(ownerData as any));
  const connectedNormalized = stripLeadingZeros(normalizeAddress(connectedAddress));
  const isOwner = !!ownerNormalized && !!connectedNormalized && ownerNormalized === connectedNormalized;


  return (
    <div className="flex items-center flex-col grow pt-10">
      <h1 className="text-3xl font-bold mb-6">Scaffold-Stark Counter</h1>
      <div className="flex items-center gap-4 mb-6">
        <DecrementCounterButton value={data as any} isLoading={isLoading} />
        <CounterValue value={data as any} isLoading={isLoading} errorText={error ? "Error" : undefined} />
        <IncrementCounterButton />
        <SetCounterButton isOwner={isOwner} disabledReason="Only owner" />
      </div>
      <div className="mb-6">
        <ResetCounterButton />
      </div>
      <div className="w-full max-w-2xl">
        <CounterChangedEvents />
      </div>
    </div>
  );
};

export default Home;
