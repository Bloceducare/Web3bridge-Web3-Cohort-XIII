// ignition/modules/MultiSig.ts
import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

const MultiSigModule = buildModule('MultiSigModule', (m) => {
  // Define the constructor parameters
  const owners = [
    '0x0bA50b9001b2ECcd3869CC73c07031dca1e11412',
    '0xA1c90315f01807ad68F2826277137b8a47aBF1DF'
  ]

  const requiredConfirmations = 2

  // Pass them to the contract constructor
  const multisig = m.contract('MultiSig', [owners, requiredConfirmations])

  return { multisig }
})

export default MultiSigModule
