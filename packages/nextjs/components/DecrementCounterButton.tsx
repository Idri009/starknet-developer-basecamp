"use client";
import React from "react";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-stark/useScaffoldWriteContract";

/**
 * DecrementCounterButton
 * Sends a transaction calling the `decrement` external function on `CounterContract`.
 * Disabled when the current counter value is 0 (or still loading / tx pending).
 */
export const DecrementCounterButton: React.FC<{ className?: string; value?: bigint | number; isLoading?: boolean }> = ({ className = "", value, isLoading }) => {
  const { sendAsync, status } = useScaffoldWriteContract({
    contractName: "CounterContract",
    functionName: "decrement",
  });
  const counter = value === undefined || value === null ? 0 : Number(value);
  const isPending = status === "pending";
  const disabled = isPending || isLoading || counter <= 0;

  return (
    <button
      type="button"
      className={`btn btn-primary btn-sm ${className}`}
  disabled={disabled}
      onClick={() => sendAsync?.()}
      aria-disabled={disabled}
      aria-label="Decrement counter"
    >
      {isPending ? "Decrementing..." : "-1"}
    </button>
  );
};

export default DecrementCounterButton;
