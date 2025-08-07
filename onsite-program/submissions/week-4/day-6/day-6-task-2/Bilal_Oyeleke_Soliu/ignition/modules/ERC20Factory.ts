import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ERC20FactoryModule = buildModule("ERC20FactoryModule", (m) => {
  const erc20Factory = m.contract("ERC20Factory", [
    "TestToken", // _name
    "TTK",       // _symbol
    18           // _decimal
  ]);

  return { erc20Factory };
});

export default ERC20FactoryModule;
