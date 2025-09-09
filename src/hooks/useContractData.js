import { useReadContract, useAccount, useBalance } from 'wagmi';
import { STAKING_CONTRACT_ABI, STAKING_TOKEN_ABI } from '../config/ABI.js';

const STAKING_CONTRACT_ADDRESS = import.meta.env.VITE_STAKING_CONTRACT;
const STAKING_TOKEN_ADDRESS = import.meta.env.VITE_STAKING_TOKEN;

export const useContractData = () => {
  const { address } = useAccount();

 
  const { data: userDetails, refetch: refetchUserDetails } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_CONTRACT_ABI,
    functionName: 'getUserDetails',
    args: address ? [address] : undefined,
    enabled: !!address,
  });

 
  const { data: totalStaked, refetch: refetchTotalStaked } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_CONTRACT_ABI,
    functionName: 'totalStaked',
  });


  const { data: currentRewardRate } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_CONTRACT_ABI,
    functionName: 'currentRewardRate',
  });

 
  const { data: initialApr } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_CONTRACT_ABI,
    functionName: 'initialApr',
  });

 
  const { data: emergencyWithdrawPenalty } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_CONTRACT_ABI,
    functionName: 'emergencyWithdrawPenalty',
  });


  const { data: minLockDuration } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_CONTRACT_ABI,
    functionName: 'minLockDuration',
  });


  const { data: tokenSymbol } = useReadContract({
    address: STAKING_TOKEN_ADDRESS,
    abi: STAKING_TOKEN_ABI,
    functionName: 'symbol',
  });


  const { data: tokenName } = useReadContract({
    address: STAKING_TOKEN_ADDRESS,
    abi: STAKING_TOKEN_ABI,
    functionName: 'name',
  });


  const { data: tokenBalance, refetch: refetchBalance } = useBalance({
    address: address,
    token: STAKING_TOKEN_ADDRESS,
    enabled: !!address,
  });


  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: STAKING_TOKEN_ADDRESS,
    abi: STAKING_TOKEN_ABI,
    functionName: 'allowance',
    args: address ? [address, STAKING_CONTRACT_ADDRESS] : undefined,
    enabled: !!address,
  });

  return {
  
    userDetails,
    totalStaked,
    currentRewardRate,
    initialApr,
    emergencyWithdrawPenalty,
    minLockDuration,
    tokenSymbol: tokenSymbol || 'TOKEN',
    tokenName: tokenName || 'Token',
    tokenBalance,
    allowance,
    
   
    refetchUserDetails,
    refetchTotalStaked,
    refetchBalance,
    refetchAllowance,
  };
};
