// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/TicketNft.sol";
import "../src/TicketToken.sol";
import "../src/EventTicketing.sol";

contract Deploy is Script {
    function run() external {
        vm.startBroadcast();

        TicketNft nft = new TicketNft(msg.sender);
        TicketToken token = new TicketToken(1000 ether);

        EventTicketing eventSystem = new EventTicketing(
            0.01 ether,
            address(nft),
            address(token)
        );

        vm.stopBroadcast();
    }
}
