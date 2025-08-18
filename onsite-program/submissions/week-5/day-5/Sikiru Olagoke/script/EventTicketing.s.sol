// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;


import {Script, console} from "forge-std/Script.sol";
import {EventTicketing} from "../src/EventTicketing.sol";
import {TicketToken} from "../src/TicketToken.sol";
import {TicketNft} from "../src/TicketNft.sol";


contract EventTicketingScript is Script {
  EventTicketing public eventTicketing;
  TicketToken public ticketToken;
  TicketNft public ticketNft;

  function setUp() public {}

  function run() public {
    vm.startBroadcast();
   // ticketToken = new TicketToken(10000000);
    //ticketNft = new TicketNft();
    eventTicketing = new EventTicketing("Web3Lagos", "Gbagada", 100);

 //  console.log("TicketToken contract address at: ", address(ticketToken));
  //  console.log("TicketNft contract address at: ", address(ticketNft));
    console.log("EventTicketing contract address at: ", address(eventTicketing));



    vm.stopBroadcast();


  }
}
