"use client";
import React, { useMemo } from "react";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-stark/useScaffoldEventHistory";

/**
 * CounterChangedEvents
 * Lists all CounterChanged events emitted by the CounterContract since deployment.
 * Uses the scaffold-stark event history hook with watch enabled for live updates.
 */

type Reason = {
    variant: Record<string, {}>;
};

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

  // Build display list: sort newest -> oldest explicitly (by block number if present), then apply optional limit.
  const displayEvents = useMemo(() => {
    const evts = (data || []).slice();
    // Attempt to detect presence of block numbers to create a stable descending order.
    evts.sort((a: any, b: any) => {
      const aBlock = a?.log?.block_number ?? a?.log?.blockNumber ?? a?.blockNumber ?? 0;
      const bBlock = b?.log?.block_number ?? b?.log?.blockNumber ?? b?.blockNumber ?? 0;
      if (aBlock !== bBlock) return bBlock - aBlock; // higher block first
      // Fallback: if same block (or missing), keep original relative order by timestamp or index if available
      const aIdx = a?._idx ?? 0;
      const bIdx = b?._idx ?? 0;
      return bIdx - aIdx; // newer (higher idx) first
    });
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

          // Generic formatter (non-enum fields)
          const fmt = (val: any) => {
            if (val === undefined || val === null) return "-";
            if (typeof val === "object") return JSON.stringify(val);
            if (typeof val === "bigint") return val.toString();
            return String(val);
          };
          
          const activeVariant = (reason: Reason): string => {
            const variant = reason?.variant;
            const keys = Object.keys(variant);
            if (keys.length === 0) {
                return "Unknown";
            } else if (keys.length === 1) {
                return keys[0];
            } else {
                return keys.find((k) => variant[k] ) ?? "";
            }
          }

          // Extract fields with flexible naming
          const oldCount = parsed?.old_count ?? parsed?.oldCount;
          const newCount = parsed?.new_count ?? parsed?.newCount;
          const reasonRaw = parsed?.reason ?? parsed?.reason_name;
          const reasonLabel = activeVariant(reasonRaw);
          const caller = parsed?.caller;
          const txHash = evt.log?.transaction_hash as string | undefined;

          const reasonBadgeClass = (() => {
            switch (reasonLabel) {
              case "Incremented": return "badge-success";
              case "Decremented": return "badge-error";
              case "Set": return "badge-info";
              case "Reset": return "badge-warning";
              default: return "badge-outline";
            }
          })();
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
                <span className={`badge ${reasonBadgeClass} badge-sm font-normal`}>{reasonLabel}</span>
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
