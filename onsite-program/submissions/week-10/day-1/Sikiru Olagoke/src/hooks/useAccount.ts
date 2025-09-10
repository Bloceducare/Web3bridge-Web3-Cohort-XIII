import React from "react";
import { walletClient } from "@/config/config";

export function useAddress() {
  const account = React.useCallback(async () => {
    const userAddress = await walletClient.getAddresses();

    console.log(userAddress);
  }, []);

  return [account];
}
