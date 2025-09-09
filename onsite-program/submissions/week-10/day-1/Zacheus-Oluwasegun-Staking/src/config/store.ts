import { create } from 'zustand'

interface TokenState {
  tokenSymbol: string
  tokenName: string  
  setTokenSymbol: (sym : string) => void
}

interface StakingContractState {
  totalStaked : bigint
  setTotalStaked : (total : bigint) => void
}

const useStakeTokenStore = create<TokenState>((set) => ({
  tokenSymbol: '',
  tokenName: 'MyStakeToken',
  setTokenSymbol: (sym : string) => set(() => ({ tokenSymbol: sym })),
}))

export const useStakingContractStore = create<StakingContractState>((set) => ({
  totalStaked : 0n,
  setTotalStaked : (total : bigint) => set(() => ({ totalStaked : total }))
}))


export default useStakeTokenStore
