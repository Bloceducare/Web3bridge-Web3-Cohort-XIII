import { useAccount, useBalance } from "wagmi";

const useWallet = (tokenAddress) => {
  const { address, isConnected } = useAccount();

  const { data: nativeBalance } = useBalance({
    address,
    watch: true,
  });

  const { data: tokenBalance } = useBalance({
    address,
    token: tokenAddress,
    watch: true,
  });

  return {
    address,
    isConnected,
    nativeBalance,
    tokenBalance,
  };
};

export default useWallet;
