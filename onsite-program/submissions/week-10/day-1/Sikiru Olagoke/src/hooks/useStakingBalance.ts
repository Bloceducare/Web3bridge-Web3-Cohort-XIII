import React from "react";
import { contractData, publicClient } from "@/config/config";
import { useAccount } from "wagmi";
import { formatEther, parseAbiItem } from "viem";

function useStakingBalance() {
  const [userInfo, setUserInfo] = React.useState<UserInfoProp | undefined>(
    undefined,
  );
  const { address: account } = useAccount();

  const data = React.useMemo(async () => {
    const request = publicClient.readContract({
      address: contractData.contractAddress,
      abi: contractData.contractABI,
      functionName: "userInfo",
      args: [account],
    });

    return request;
  }, [account]);

  React.useEffect(
    function () {
      (async () => {
        const [stakedAmount, lastStakeTimeStamp, rewardDebt, pendingRewards] =
          (await data) as number[];

        setUserInfo({
          stakedAmount: Number(formatEther(BigInt(stakedAmount))),
          lastStakeTimeStamp,
          rewardDebt,
          pendingRewards: Number(
            parseFloat(formatEther(BigInt(pendingRewards))).toFixed(4),
          ),
        });
      })();

      (() => {
        const unwatch = publicClient.watchEvent({
          address: contractData.contractAddress,
          event: parseAbiItem(
            "event Staked(address indexed user, uint256 amount, uint256 timestamp, uint256 newTotalStaked, uint256 currentRewardRate)",
          ),
          onLogs: (data) => console.log(data[0].args),
        });
      })();
    },
    [data],
  );

  return { ...userInfo };
}

export default useStakingBalance;
