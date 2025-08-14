// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

const LootBoxModule = buildModule('LootBoxModule', (m) => {
  // Parameters with defaults for Sepolia testnet
  const subscriptionId = m.getParameter('subscriptionId', 1)
  const boxPrice = m.getParameter('boxPrice', '10000000000000000') // 0.01 ETH in wei

  // Deploy token contracts first
  const gameToken = m.contract('GameToken', [])
  const gameNFT = m.contract('GameNFT', [])
  const gameItem = m.contract('GameItem', [])

  // Deploy LootBox contract with token addresses
  const lootBox = m.contract('LootBox', [
    subscriptionId,
    gameToken,
    gameNFT,
    gameItem,
    1 // ERC1155 token ID
  ])

  // Setup initial inventory after deployment
  const tokenTransferAmount = '1000000000000000000000000' // 1M tokens (18 decimals)
  const itemTransferAmount = 500

  // Transfer tokens to loot box for initial inventory
  m.call(gameToken, 'transfer', [lootBox, tokenTransferAmount], {
    id: 'transfer-game-tokens'
  })

  m.call(
    gameItem,
    'safeTransferFrom',
    [
      m.getAccount(0), // deployer address
      lootBox,
      1, // token ID
      itemTransferAmount,
      '0x'
    ],
    {
      id: 'transfer-game-items'
    }
  )

  // Transfer first 50 NFTs to loot box
  const nftTokenIds = Array.from({ length: 50 }, (_, i) => i)

  // Transfer NFTs one by one
  for (let i = 0; i < 50; i++) {
    m.call(
      gameNFT,
      'transferFrom',
      [
        m.getAccount(0), // deployer address
        lootBox,
        i
      ],
      {
        id: `transfer-nft-${i}`
      }
    )
  }

  // Replenish ERC721 inventory in the loot box
  m.call(lootBox, 'replenishERC721Inventory', [nftTokenIds], {
    id: 'replenish-nft-inventory'
  })

  return {
    lootBox,
    gameToken,
    gameNFT,
    gameItem
  }
})

export default LootBoxModule

// This setup uses Hardhat Ignition to manage smart contract deployments.
// // Learn more about it at https://hardhat.org/ignition

// import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// const JAN_1ST_2030 = 1893456000;
// const ONE_GWEI: bigint = 1_000_000_000n;

// const LockModule = buildModule("LockModule", (m) => {
//   const unlockTime = m.getParameter("unlockTime", JAN_1ST_2030);
//   const lockedAmount = m.getParameter("lockedAmount", ONE_GWEI);

//   const lock = m.contract("Lock", [unlockTime], {
//     value: lockedAmount,
//   });

//   return { lock };
// });

// export default LockModule;
