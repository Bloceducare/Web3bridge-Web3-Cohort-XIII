import { useState } from "react";
import React from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { contractConfig } from "../lib/contract";
import { erc20Abi } from "../lib/erc20";
import { stakingAddress } from "../lib/stakingAbi";

export default function StakeForm() {
  const [amount, setAmount] = useState("");
  const { address } = useAccount();

  const { writeContract: writeApprove } = useWriteContract();
  const { writeContract: writeStake, data: stakeTx } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({
    hash: stakeTx,
  });

  const handleApprove = () => {
    writeApprove({
      address: "0x4e7dfc0650af7c1619e842a78a7ca0ea57c1077f", // stakingToken address
      abi: erc20Abi,
      functionName: "approve",
      args: [stakingAddress, amount],
    });
  };

  const handleStake = () => {
    writeStake({
      ...contractConfig,
      functionName: "stake",
      args: [amount],
    });
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold">Stake Tokens</h2>
      <input
        type="number"
        placeholder="Amount"
        className="border p-2 mr-2"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button
        onClick={handleApprove}
        className="bg-blue-500 text-white px-4 py-2 mr-2"
      >
        Approve
      </button>
      <button
        onClick={handleStake}
        disabled={isLoading}
        className="bg-green-500 text-white px-4 py-2"
      >
        {isLoading ? "Staking..." : "Stake"}
      </button>
      {isSuccess && <p className="text-green-600">✅ Stake successful!</p>}
    </div>
  );
}
