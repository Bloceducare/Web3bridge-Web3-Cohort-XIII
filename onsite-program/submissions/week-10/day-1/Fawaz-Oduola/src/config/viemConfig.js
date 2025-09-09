import { createPublicClient, createWalletClient, custom, http } from 'viem'
import { mainnet,sepolia } from 'viem/chains'
 
export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http()
})
 
export const walletClient = createWalletClient({
  chain: sepolia,
  transport: http("https://eth-sepolia.g.alchemy.com/v2/lLpkkKh-qYy07aId2w0OybrzwtrmeUwx")
})
 
// JSON-RPC Account
export const [account] = await walletClient.getAddresses()
// export const w = await walletClient.requestAddresses()

console.log(account)
