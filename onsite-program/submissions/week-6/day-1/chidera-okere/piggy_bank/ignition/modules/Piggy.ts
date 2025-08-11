import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

const PiggyBankFactoryModule = buildModule('PiggyBankFactoryModule', (m) => {
  const piggyBankFactory = m.contract('PiggyBankFactory', [])

  // Immediately create a PiggyBank for the deployer
  m.call(piggyBankFactory, 'createPiggyBank', [])

  return { piggyBankFactory }
})

export default PiggyBankFactoryModule
