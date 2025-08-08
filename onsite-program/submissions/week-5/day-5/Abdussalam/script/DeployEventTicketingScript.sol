// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {EventTicketing} from "../src/EventTicketing.sol";

// Mock ERC20 token for deployment
contract MockTicketToken is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }
}

contract EventTicketingScript is Script {
    EventTicketing public eventTicketing;
    MockTicketToken public ticketToken;

    function run() public {
        vm.startBroadcast();

        // Deploy a mock ERC20 token for testing
        ticketToken = new MockTicketToken("TicketToken", "TTK");
        // Deploy the EventTicketing contract with the token address
        eventTicketing = new EventTicketing(address(ticketToken));

        // Create a sample event
        eventTicketing.createEvent("Test Event", 100, 100 * 10 ** ticketToken.decimals());

        vm.stopBroadcast();

        console.log("EventTicketing deployed at:", address(eventTicketing));
        console.log("TicketToken deployed at:", address(ticketToken));
    }
}