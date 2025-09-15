"use client";
import React, { useCallback, useMemo } from "react";
import { uint256 } from "starknet";
import { useAccount } from "@starknet-react/core";
import { useDeployedContractInfo } from "~~/hooks/scaffold-stark/useDeployedContractInfo";
import useScaffoldStrkBalance from "~~/hooks/scaffold-stark/useScaffoldStrkBalance";
import { useScaffoldMultiWriteContract } from "~~/hooks/scaffold-stark/useScaffoldMultiWriteContract";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";

/**
 * ResetCounterButton
 * - Shows STRK cost (1 STRK)
 * - Checks user balance
 * - Builds batched calls: approve (if insufficient allowance) + reset_counter
 * - Uses uint256.bnToUint256 for payment amount (1 * 10 ** 18)
 * - Automatically detects existing allowance; only shows approve toggle if additional allowance required
 */
export const ResetCounterButton: React.FC<{ className?: string }> = ({ className = "" }) => {
  const { address } = useAccount();
  const { data: counterInfo } = useDeployedContractInfo("CounterContract");
  const { data: strkInfo } = useDeployedContractInfo("Strk");
  const { value: balance, isLoading: balanceLoading } = useScaffoldStrkBalance({ address });

  // 1 STRK in wei (18 decimals)
  const paymentBigInt = useMemo(() => 10n ** 18n, []);
  const paymentU256 = useMemo(() => uint256.bnToUint256(paymentBigInt), [paymentBigInt]);

  const insufficient = !!address && balance !== undefined && balance < paymentBigInt;

  // Read existing allowance owner(address) -> spender(counter contract)
  const { data: allowanceRaw } = useScaffoldReadContract({
    contractName: "Strk" as any,
    functionName: "allowance" as any,
    args: address && counterInfo?.address ? [address as any, counterInfo.address as any] : ([] as any[]),
  } as any);

  // allowanceRaw is u256 (felt high/low) already flattened to bigint by scaffold (see balance hook pattern)
  const allowance: bigint | undefined = allowanceRaw as unknown as bigint | undefined;
  const needsApprove = useMemo(() => {
    if (!allowance) return true; // treat undefined as needs approve
    return allowance < paymentBigInt;
  }, [allowance, paymentBigInt]);

  const calls = useMemo(() => {
    if (!counterInfo?.address || !strkInfo?.address) return [] as any[];
    const list: any[] = [];
    if (needsApprove) {
      list.push({
        contractName: "Strk" as any,
        functionName: "approve" as any,
        args: [counterInfo.address, paymentU256] as any,
      });
    }
    list.push({
      contractName: "CounterContract" as any,
      functionName: "reset_counter" as any,
      args: [] as any,
    });
    return list;
  }, [counterInfo?.address, strkInfo?.address, needsApprove, paymentU256]);

  const { sendAsync, status, error } = useScaffoldMultiWriteContract({ calls } as any);
  const isLoading = status === "pending"; // transaction in-flight

  const onClick = useCallback(async () => {
    if (!address) return;
    await sendAsync();
  }, [address, sendAsync]);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        <button
          className="btn btn-error btn-sm"
          onClick={onClick}
          disabled={!address || isLoading || insufficient || !counterInfo?.address || !strkInfo?.address}
        >
          {isLoading ? "Resetting..." : "Reset Counter"}
        </button>
      </div>
    </div>
  );
};

export default ResetCounterButton;
