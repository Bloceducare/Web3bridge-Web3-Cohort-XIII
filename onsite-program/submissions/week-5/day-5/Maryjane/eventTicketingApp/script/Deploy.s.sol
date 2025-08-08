// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/TicketNFT.sol";

contract Deploy is Script {
    function run() external {
        vm.startBroadcast();
        TicketNFT nft = new TicketNFT();
        vm.stopBroadcast();
    }
}
