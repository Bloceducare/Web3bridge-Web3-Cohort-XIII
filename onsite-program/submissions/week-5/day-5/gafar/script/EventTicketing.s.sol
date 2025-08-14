// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {EventTicketing} from "../src/EventTicketing.sol";
import {TicketToken} from "../src/TicketToken.sol";
import {TicketNft} from "../src/TicketNft.sol";

contract DeployAllContracts is Script {
    function run() public {
        vm.startBroadcast();

        uint256 initialSupply = 1_000_000 ether; 
        TicketToken paymentToken = new TicketToken(initialSupply);
        console.log("TicketToken deployed at:", address(paymentToken));

        TicketNft ticketNFT = new TicketNft(msg.sender);
        console.log("TicketNft deployed at:", address(ticketNFT));

        EventTicketing eventTicket = new EventTicketing(
            address(paymentToken),
            address(ticketNFT)
        );
        console.log("EventTicketing deployed at:", address(eventTicket));

        ticketNFT.transferOwnership(address(eventTicket));
        console.log("TicketNft ownership transferred to EventTicketing");

        vm.stopBroadcast();
    }
}
