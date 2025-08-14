export type NetworkConfig = Record<
  string,
  {
    name: string
    linkToken: string
    vrfCoordinatorV2: string
    keyHash: string
    fundAmount: string
  }
>

export const networkConfig: NetworkConfig = {
  '11155111': {
    name: 'sepolia',
    linkToken: '0x779877A7B0D9E8603169DdbD7836e478b4624789',
    vrfCoordinatorV2: '0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625',
    keyHash:
      '0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c',
    fundAmount: '10000000000000000000', // 10 LINK
  },
}
