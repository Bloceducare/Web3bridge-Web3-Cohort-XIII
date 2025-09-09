import React from "react";
import { contractData, publicClient } from "@/config/config";
import { useAccount } from "wagmi";
import { formatEther, getAddress, parseAbiItem } from "viem";
//import useApproval from "./useApproval";

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

  const unwatch = React.useMemo(() => {
    publicClient.watchEvent({
      address: contractData.contractAddress,
      event: parseAbiItem(
        "event Staked(address indexed user, uint256 amount, uint256 timestamp, uint256 newTotalStaked, int256 currentRewardRate)",
      ),
      onLogs: (logs) => console.log(logs),
    });
  }, []);

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
    },
    [data, unwatch],
  );

  return { ...userInfo };
}

export default useStakingBalance;
