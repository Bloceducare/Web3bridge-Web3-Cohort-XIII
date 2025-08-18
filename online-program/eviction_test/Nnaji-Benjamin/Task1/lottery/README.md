### contract address

`0xF6fD0e21072A46D21017f157a2Ff81669fB53197`

### deploy smart contract

```bash
forge script script/Deploy.s.sol:DeployLottery --rpc-url $RPC_URL_LISK_SEPOLIA --broadcast --verify -vvvv
```

### verify smart contract

```bash
forge verify-contract \
  --chain-id 4202 \
  --verifier blockscout \
  --verifier-url https://sepolia-blockscout.lisk.com/api \
  0xF6fD0e21072A46D21017f157a2Ff81669fB53197 \
  src/Lottery.sol:Lottery \
  --compiler-version 0.8.13 \
  --num-of-optimizations 200
```

### check current players

```bash
cast call 0xF6fD0e21072A46D21017f157a2Ff81669fB53197 "getPlayers()(address[])" --rpc-url $RPC_URL_LISK_SEPOLIA
```

### check current contract balance

```bash
cast call 0xF6fD0e21072A46D21017f157a2Ff81669fB53197 "getBalance()(uint256)" --rpc-url $RPC_URL_LISK_SEPOLIA
```

### View Events (after all 10 players join)

```bash
cast logs --from-block 25111046 --address 0xF6fD0e21072A46D21017f157a2Ff81669fB53197 --rpc-url $RPC_URL_LISK_SEPOLIA
```

### Deploy with test accounts locally (Deployment script)

```bash
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/Lottery.sol";

contract DeployLottery is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        Lottery lottery = new Lottery();

        console.log("Lottery deployed at:", address(lottery));

        // Optional: Join with test accounts
        address[] memory testAccounts = new address[](10);
        for (uint i = 0; i < 10; i++) {
            testAccounts[i] = address(uint160(uint256(keccak256(abi.encodePacked(i)))));
            vm.deal(testAccounts[i], 1 ether);
            vm.prank(testAccounts[i]);
            lottery.join{value: 0.01 ether}();
            console.log("Player %d joined: %s", i, testAccounts[i]);
        }

        vm.stopBroadcast();
    }
}
```

### for local testing

```bash
# Start local node
anvil

# In another terminal
forge script script/Deploy.s.sol --broadcast -vvvv
```
