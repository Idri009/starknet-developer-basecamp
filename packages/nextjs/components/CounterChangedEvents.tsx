"use client";
import React, { useMemo } from "react";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-stark/useScaffoldEventHistory";

/**
 * CounterChangedEvents
 * Lists all CounterChanged events emitted by the CounterContract since deployment.
 * Uses the scaffold-stark event history hook with watch enabled for live updates.
 */
export const CounterChangedEvents: React.FC<{
  className?: string;
  fromBlock?: bigint; // optionally override starting block
  limit?: number; // optionally limit number displayed (most recent first)
}> = ({ className = "", fromBlock = 0n, limit }) => {
  const { data, isLoading, error } = useScaffoldEventHistory(
    {
      contractName: "CounterContract",
      eventName: "CounterChanged",
      fromBlock,
      watch: true,
      blockData: false,
      transactionData: false,
      receiptData: false,
    } as any,
  );

  // data comes oldest -> newest based on hook logic (we reversed when pushing). We'll display newest first.
  const displayEvents = useMemo(() => {
    const evts = (data || []).slice().reverse();
    return typeof limit === "number" ? evts.slice(0, limit) : evts;
  }, [data, limit]);

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Counter Changed Events</h2>
        {isLoading && (
          <span className="loading loading-spinner loading-xs" aria-label="Loading events" />
        )}
      </div>
      {error && (
        <div className="text-error text-sm mb-2">
          Error loading events: {String(error)}
        </div>
      )}
      {!error && !isLoading && displayEvents.length === 0 && (
        <div className="text-sm opacity-70">No events found.</div>
      )}
      <ul className="space-y-2 max-h-96 overflow-auto pr-1">
        {displayEvents.map((evt: any, idx: number) => {
          const parsed = evt.parsedArgs || evt.args || {};

          const fmt = (val: any) => {
            if (val === undefined || val === null) return "-";
            if (typeof val === "object") {
              if ("variant" in val && typeof (val as any).variant === "string") {
                return (val as any).variant;
              }
              return JSON.stringify(val);
            }
            if (typeof val === "bigint") return val.toString();
            return String(val);
          };

            // Extract fields with flexible naming
          const oldCount = parsed?.old_count ?? parsed?.oldCount;
          const newCount = parsed?.new_count ?? parsed?.newCount;
          const reasonRaw = parsed?.reason ?? parsed?.reason_name;
          const caller = parsed?.caller;
          const txHash = evt.log?.transaction_hash as string | undefined;
          return (
            <li
              key={`${txHash || "tx"}-${idx}`}
              className="border border-base-300 rounded-lg p-2 bg-base-200/40 text-xs font-mono"
            >
              <div className="flex justify-between mb-1">
                <span className="font-semibold">#{displayEvents.length - idx}</span>
                {txHash && (
                  <span className="truncate max-w-[140px]" title={txHash}>
                    {txHash.slice(0, 10)}…
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                <span className="opacity-70">old:</span>
                <span>{fmt(oldCount)}</span>
                <span className="opacity-70">new:</span>
                <span>{fmt(newCount)}</span>
                <span className="opacity-70">reason:</span>
                <span>{fmt(reasonRaw)}</span>
                <span className="opacity-70">caller:</span>
                <span className="truncate" title={fmt(caller)}>{fmt(caller)}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default CounterChangedEvents;
