// "import { ethers } from "hardhat";
// import * as dotenv from "dotenv";
// dotenv.config();


// async function main() {
//   const signer = (await ethers.getSigners())[0];
//   console.log("Using deployer:", signer.address);

//   const erc20Address = process.env.ERC20!;
//   const erc721Address = process.env.ERC721!;
//   const erc1155Address = process.env.ERC1155!;
//   const lootBoxAddress = process.env.LOOTBOX!;

//   // if (!erc20Address || !erc721Address || !erc1155Address || !lootBoxAddress) {
//     throw new Error("Set ERC20/ ERC721 / ERC1155 / LOOTBOX env vars");
//   }

//   const erc20 = await ethers.getContractAt("ERC20PresetMinterPauser", erc20Address);
//   const erc721 = await ethers.getContractAt("ERC721PresetMinterPauserAutoId", erc721Address);
//   const erc1155 = await ethers.getContractAt("ERC1155PresetMinterPauser", erc1155Address);

//   const MINTER = await erc20.MINTER_ROLE();

//   console.log("Granting MINTER_ROLE to LootBox on ERC20...");
//   await (await erc20.grantRole(MINTER, lootBoxAddress)).wait();
//   console.log("ERC20 minter granted.");

//   console.log("Granting MINTER_ROLE to LootBox on ERC721...");
//   await (await erc721.grantRole(MINTER, lootBoxAddress)).wait();
//   console.log("ERC721 minter granted.");

//   console.log("Granting MINTER_ROLE to LootBox on ERC1155...");
//   await (await erc1155.grantRole(MINTER, lootBoxAddress)).wait();
//   console.log("ERC1155 minter granted.");
// }

// main().catch((e) => {
//   console.error(e);
//   process.exitCode = 1;
// });
// "