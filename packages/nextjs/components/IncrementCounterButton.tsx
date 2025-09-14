"use client";
import React from "react";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-stark/useScaffoldWriteContract";

/**
 * IncrementCounterButton
 * Triggers the `increment` external function on `CounterContract`.
 */
export const IncrementCounterButton: React.FC<{ className?: string; disabled?: boolean }> = ({ className = "", disabled }) => {
  const { sendAsync, status } = useScaffoldWriteContract({
    contractName: "CounterContract",
    functionName: "increment",
  });

  const isMining = status === "pending"; // pending status from hook

  return (
    <div className={`flex flex-col items-start gap-1 ${className}`}>
      <button
        type="button"
        className="btn btn-primary btn-sm"
  disabled={isMining || disabled}
        onClick={() => sendAsync?.()}
      >
        {isMining ? "Incrementing..." : "+1"}
      </button>
    </div>
  );
};

export default IncrementCounterButton;
