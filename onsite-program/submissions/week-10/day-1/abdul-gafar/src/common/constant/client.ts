import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'
 
export const publicClient = createPublicClient({ 
  chain: sepolia,
  transport: http(`https://sepolia.infura.io/v3/fd19273c7b1845e6a642530de7fac8ef`)
})
