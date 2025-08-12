import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("MultiSigModule", (m) => {
  const owners = [
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", //Address 1 from hardhat public addresses.
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", //Address 2 from hardhat public addresses.
    "0x90F79bf6EB2c4f870365E785982E1f101E93b906" //Address 3 from hardhat public addresses.
  ];
  const requiredConfirmations = 2;

  const multiSig = m.contract("MultiSigWallet", [owners, requiredConfirmations]);

  return { multiSig };
}); 