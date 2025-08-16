import hre from "hardhat";
import { verifyContract } from "@nomicfoundation/hardhat-verify/verify";

await verifyContract(
  {
    address: "0x0fC4D47304060d0B0BE73Ac06D2383B2FEae408E",
    // constructorArgs: ["Constructor argument 1"],
    provider: "etherscan",
  },
  hre,
);
