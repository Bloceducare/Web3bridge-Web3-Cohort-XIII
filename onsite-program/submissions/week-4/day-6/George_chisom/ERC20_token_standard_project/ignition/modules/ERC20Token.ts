import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ERC20TokenModule = buildModule("ERC20TokenModule", (m) => {
  const _admin = "0xe099fA204938657fd6F81671d1f7d14ec669B24D";

  const _firstSupply = 1000; // 1000 tokens

  const token = m.contract("ERC20Token", [_admin, _firstSupply]);

  return { token };
});

export default ERC20TokenModule;
