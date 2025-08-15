const { buildModule } = require('@nomicfoundation/hardhat-ignition/modules')

module.exports = buildModule('DAODeployment', (m) => {
  // Deploy InstitutionStaffNFT
  const institutionStaffNFT = m.contract('InstitutionStaffNFT', [], {
    // Optional: Specify deployment options
  })

  // Deploy TokenGatedDAO, passing the InstitutionStaffNFT address as a constructor argument
  const tokenGatedDAO = m.contract('TokenGatedDAO', [institutionStaffNFT], {
    // Optional: Specify deployment options
  })

  // Return the deployed contracts for reference
  return {
    institutionStaffNFT,
    tokenGatedDAO
  }
})
