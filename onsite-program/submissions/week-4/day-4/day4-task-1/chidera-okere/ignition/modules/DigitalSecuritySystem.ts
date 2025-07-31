// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

const DigitalSecuritySystemModule = buildModule('DigitalSecuritySystemModule', (m) => {
  const DigitalSecuritySystem = m.contract('digital_security_system')

  return { DigitalSecuritySystem }
})

export default DigitalSecuritySystemModule
