import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("LootBoxModule", (m) => {
  const erc20 = m.contract("MyERC20");
  const erc721 = m.contract("MyERC721");
  const erc1155 = m.contract("MyERC1155");

  // Example rewards
  const rewards = [
    {
      kind: 0, // ERC20
      token: erc20,
      tokenId: 0,
      amount: 1000n * 10n ** 18n,
      mintOnClaim: true,
    },
    {
      kind: 1, // ERC721
      token: erc721,
      tokenId: 1,
      amount: 0n,
      mintOnClaim: true,
    },
    {
      kind: 2, // ERC1155
      token: erc1155,
      tokenId: 1,
      amount: 10n,
      mintOnClaim: true,
    },
  ];

  // Chainlink VRF Sepolia values
  const vrfKeyHash =
    "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae";
  const vrfCoordinator = "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B";
  const vrfSubId = 102604375660491978661911785256805826821720330514371700056408289845527972903581; // Replace with your subscription ID

  const lootbox = m.contract("LootBox", [rewards, vrfKeyHash, vrfCoordinator, vrfSubId]);

  return { lootbox, erc20, erc721, erc1155 };
});
