"use client";
import React, { useEffect, useState } from "react";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-stark/useScaffoldWriteContract";

interface SetCounterButtonProps {
  isOwner: boolean;
  className?: string;
  disabledReason?: string;
}

export const SetCounterButton: React.FC<SetCounterButtonProps> = ({
  isOwner,
  className = "",
  disabledReason,
}) => {
  const { sendAsync, status } = useScaffoldWriteContract({
    contractName: "CounterContract",
    functionName: "set_counter",
  } as any);

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const isPending = status === "pending";

  const validate = (val: string) => {
    if (val.trim() === "") return "Required";
    if (!/^\d+$/.test(val)) return "Must be a positive integer";
    try {
      const num = BigInt(val);
      if (num < 0n) return "Must be >= 0";
      if (num > 0xffffffffn) return "> u32 max";
    } catch {
      return "Invalid number";
    }
    return null;
  };

  useEffect(() => {
    if (!open) {
      setValue("");
      setError(null);
    }
  }, [open]);

  const onConfirm = async () => {
    const err = validate(value);
    setError(err);
    if (err) return;
    try {
      await sendAsync?.({ args: [Number(value)] });
      setOpen(false);
    } catch (e: any) {
      setError(e?.message || "Transaction failed");
    }
  };

  const disabled = !isOwner || isPending;

  return (
    <>
      <button
        type="button"
        className={`btn btn-secondary btn-sm ${className}`}
        disabled={disabled}
        onClick={() => setOpen(true)}
        title={!isOwner ? disabledReason || "Only owner" : undefined}
      >
        Set
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !isPending && setOpen(false)}
          />
          <div className="relative bg-base-200 border border-base-300 rounded-xl p-6 w-full max-w-sm shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Set Counter</h2>
            <label className="form-control w-full mb-3">
              <span className="label-text mb-1">New value (u32)</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="input input-bordered input-sm"
                value={value}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  setValue(v);
                  setError(validate(v));
                }}
                disabled={isPending}
                placeholder="e.g. 42"
              />
            </label>
            {error && (
              <p className="text-error text-xs mb-2" role="alert">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => !isPending && setOpen(false)}
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-xs"
                disabled={!!validate(value) || isPending}
                onClick={onConfirm}
              >
                {isPending ? "Sending..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SetCounterButton;
