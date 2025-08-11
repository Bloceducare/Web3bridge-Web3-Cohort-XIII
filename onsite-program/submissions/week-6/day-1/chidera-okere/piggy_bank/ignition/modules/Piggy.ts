import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

const PiggyBankFactoryModule = buildModule('PiggyBankFactoryModule', (m) => {
  // Deploy the factory
  const piggyBankFactory = m.contract('PiggyBankFactory', [])

  // Number of piggy banks to create on deploy
  const numberOfBanks = 1

  // Create piggy banks & store call futures
  const piggyBanks = []
  for (let i = 0; i < numberOfBanks; i++) {
    const piggyBank = m.call(piggyBankFactory, 'createPiggyBank', [], {
      id: `CreatePiggyBank_${i + 1}`
    })
    piggyBanks.push(piggyBank)
  }

  // Logging after deployment should be handled outside the module, as 'afterDeploy' does not exist on IgnitionModuleBuilder.

  return { piggyBankFactory }
})

export default PiggyBankFactoryModule
