// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/LotterySmartContract.sol";

contract DeployLottery is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        LotterySmartContract lottery = new LotterySmartContract();
        console.log("Lottery Smart Contract deployed to:", address(lottery));
        console.log("Entry Fee:", lottery.ENTRY_FEE());
        console.log("Max Players:", lottery.MAX_PLAYERS());
        console.log("Owner:", lottery.owner());

        vm.stopBroadcast();
    }
}
