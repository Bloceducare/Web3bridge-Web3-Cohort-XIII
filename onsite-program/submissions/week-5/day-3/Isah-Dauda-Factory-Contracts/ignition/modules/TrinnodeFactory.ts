import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DeployTrinnodeFactoryModule = buildModule("DeployTrinnodeFactoryModule", (m) => {
  const TrinnodeFactory = m.contract("TrinnodeFactory");

  const name = "TrinNODE Dynamic";
  const symbol = "TRND";
  const decimals = 18;
  const initialSupply = 1_000_000;
  const maxSupply = 10_000_000;

  const TrinnodeContractTx = m.call(TrinnodeFactory, "createToken", [name,symbol, decimals, initialSupply, maxSupply,]);
  const allContracts = m.call(TrinnodeFactory, "getAllTokens", []);

  return { TrinnodeFactory, TrinnodeContractTx, allContracts };
});

export default DeployTrinnodeFactoryModule;
