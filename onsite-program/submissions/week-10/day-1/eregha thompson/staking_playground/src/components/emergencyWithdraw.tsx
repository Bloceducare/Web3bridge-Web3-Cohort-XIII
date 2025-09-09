"use client";

import { useState } from "react";
import { useStakingContract } from "../hooks/useStaking";

export function EmergencyWithdraw() {
  const [showConfirm, setShowConfirm] = useState(false);
  const { emergencyWithdraw, isPending } = useStakingContract();

  const handleEmergencyWithdraw = () => {
    emergencyWithdraw();
    setShowConfirm(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
      <h2 className="text-2xl font-bold mb-4 text-red-600">
        Emergency Withdraw
      </h2>
      <div className="space-y-4">
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-800 text-sm">
            <strong>Warning:</strong> Emergency withdraw will forfeit all
            pending rewards and may incur penalties. This action cannot be
            undone.
          </p>
        </div>
        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full bg-red-600 text-white py-2 cursor-pointer px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Emergency Withdraw
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-center text-red-600 font-medium">
              Are you sure?
            </p>
            <div className="flex space-x-2">
              <button
                onClick={handleEmergencyWithdraw}
                disabled={isPending}
                className="flex-1 bg-red-600 text-white py-2 px-4 cursor-pointer rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              >
                {isPending ? "Processing..." : "Confirm"}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isPending}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
