// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const EngancheTokenFactoryModule = buildModule(
  "EngancheTokenFactoryModule",
  (m) => {
    const name_ = "Enganche Token";
    const symbol_ = "ENGT";
    const decimals_ = 18;
    const totalSupply_ = 10000000; // 10 million tokens
    const engancheTokenFactory = m.contract("EngancheTokenFactory");
    // Optional: You could call createToken here if the factory supports it
    // However, this is hardcoded and may not be the best practice for production code.
    // Consider passing these parameters dynamically or through a configuration.
    // Uncomment the following lines if you want to create a token during deployment
    // const token = m.call(engancheTokenFactory, "createToken", [
    //   name_,
    //   symbol_,
    //   decimals_,
    //   totalSupply_,
    // ]);
    return { engancheTokenFactory };
  }
);

export default EngancheTokenFactoryModule;
