"use client";
import React, { useMemo } from "react";

export interface CounterValueProps {
  label?: string;
  className?: string;
  value?: bigint | number;
  isLoading?: boolean;
  errorText?: string | null;
}

/**
 * CounterValue (presentational)
 * Displays a counter value provided via props (no on-chain read inside).
 */
export const CounterValue: React.FC<CounterValueProps> = ({
  label = "Counter",
  className = "",
  value,
  isLoading,
  errorText,
}) => {
  const displayValue = useMemo(() => {
    if (isLoading) return "…";
    if (errorText) return errorText;
    if (value === undefined || value === null) return "-";
    try {
      return typeof value === "bigint" ? value.toString() : String(value);
    } catch {
      return String(value);
    }
  }, [isLoading, errorText, value]);

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <span className="text-lg font-semibold">{label}:</span>
      <span className="px-3 py-1 rounded bg-base-200 font-mono text-primary border border-base-300 min-w-[3rem] text-center">
        {displayValue}
      </span>
    </div>
  );
};

export default CounterValue;
