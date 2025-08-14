import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MultiSignatureDeploy = buildModule("MultiSignatureDeploy", (m) => {
  const owner = m.getAccount(0);
  const owner1 = m.getAccount(0);
  const owner2 = m.getAccount(0);

  const owners = [owner, owner1, owner2];
  const requiredConfirmations = 2;

  const multiSignatureAccount = m.contract(
    "MultiSignatureAccount",
    [owners, requiredConfirmations],
    {
      id: "MultiSignatureAccount",
    }
  );

  return { multiSignatureAccount };
});

export default MultiSignatureDeploy;
