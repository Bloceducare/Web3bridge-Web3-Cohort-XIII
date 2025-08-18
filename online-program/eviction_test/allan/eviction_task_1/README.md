1. Lottery Smart Contract
Design and implement a Lottery smart contract with the following requirements:
1. Entry Rule
- A user can join the lottery by paying exactly 0.01 ETH (or a set entry fee).
- Multiple players can join.
2. Player Tracking
Store the list of participants' addresses.
3. Random Winner Selection
- Once 10 players have joined, the contract automatically picks a winner.
- The winner receives the entire prize pool.
4. Events
- Emit events when a player joins and when a winner is chosen.
5. Security Considerations
- Prevent anyone from calling the winner selection function except the contract itself when 10 players have joined.
- Ensure no one can enter twice in the same round.
- Reset the lottery after each round.
Part B: Testing
Write unit tests (using Hardhat) that check:
1. Users can enter only with the exact fee.
2. The contract correctly tracks 10 players.
3. Only after 10 players, a winner is chosen.
4. The prize pool is transferred correctly to the winner.
5. The lottery resets for the next round.
Part C: Automated Script
Write a deployment + interaction script with hardhat/foundry that:
1. Deploys the contract.
2. Adds 10 test accounts to join the lottery.
3. Displays the winner's address and updated balances.
4. Runs the lottery again to confirm it resets properly.
Part D: Deployment
Deploy and verify the smart contract.
Add the smart contract address to your readme file

---

Implementation Details
- Contract: `contracts/Lottery.sol`
- Compiler: Solidity 0.8.28
- Entry fee: 0.01 ETH (`ENTRY_FEE`)
- Max players per round: 10 (`MAX_PLAYERS`)
- State:
  - `roundId` (uint256)
  - `lastWinner` (address)
  - `currentPlayers` (address[] via `getPlayers()`)
- Events:
  - `PlayerJoined(uint256 roundId, address player)`
  - `WinnerSelected(uint256 roundId, address winner, uint256 prize)`
- Security:
  - Winner selection is internal-only and auto-triggered after 10th entry
  - Prevents double-entry per round
  - Resets players and mapping each round

Test Report (Hardhat)
- Suite: `test/lottery.js`
- Results: 4 passing
  1) Requires exact fee: rejects <0.01, >0.01, 0
  2) Tracks players and prevents double entry: maintains list; blocks re-entry
  3) Winner chosen only after 10: emits `WinnerSelected` and transfers full prize
  4) Resets for next round: clears players and allows new entries

How to run tests
- `npm run build`
- `npm run test`

Automated Scripts
- Deploy: `scripts/deploy.js`
- Flow demo (2 rounds, prints winners and balances): `scripts/flow.js`
- Read state by address: `scripts/script.js`

Deployment (Lisk Sepolia)
- Network: Lisk Sepolia (chainId 4202)
- RPC: https://rpc.sepolia-api.lisk.com
- Explorer: Blockscout
- Deployed address: `0xcE80F98FA7b7F375A5B448981901ef91ECD76390`
- Verified contract: [View on Blockscout](https://sepolia-blockscout.lisk.com/address/0xcE80F98FA7b7F375A5B448981901ef91ECD76390?tab=contract)

Local usage
- Compile: `npm run build`
- Test: `npm run test`
- Deploy (Lisk Sepolia): `npm run deploy:lisk`
- Verify (Lisk Sepolia): `npm run verify:lisk -- 0xcE80F98FA7b7F375A5B448981901ef91ECD76390`
- Inspect state: `npx hardhat run scripts/script.js --network lisk-sepolia 0xcE80F98FA7b7F375A5B448981901ef91ECD76390`