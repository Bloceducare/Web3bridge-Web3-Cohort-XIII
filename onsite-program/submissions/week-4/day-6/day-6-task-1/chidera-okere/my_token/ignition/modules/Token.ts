// Fixed Deployment Script
import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

const TokenModule = buildModule('TokenModule', (m) => {
  const token = m.contract('MyERC20Token', [
    'deraCoin', // _name
    'CROK', // _symbol
    18, // _decimal
    1000000 // _initialSupply (1M tokens)
  ])

  return { token }
})

export default TokenModule
