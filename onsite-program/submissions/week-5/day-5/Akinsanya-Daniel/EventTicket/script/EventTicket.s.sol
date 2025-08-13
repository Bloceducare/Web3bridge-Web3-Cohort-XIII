// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;


import {Script, console} from "forge-std/Script.sol";
import {EventTicket} from "../src/EventTicket.sol";
import {TicketToken} from "../src/TicketToken.sol";
import {TicketNft} from "../src/TicketNft.sol";


contract EventTicketScript is Script {
  EventTicket public eventTicket;
  TicketToken public ticketToken;
  TicketNft public ticketNft;

  function setUp() public {}

  function run() public {
    vm.startBroadcast();
    ticketToken = new TicketToken(100000000000000000);
    console.log("ticketToken contract address at: ", address(ticketToken));

    ticketNft = new TicketNft();
    console.log("ticketNft contract address at: ", address(ticketNft));




    eventTicket = new EventTicket(address(ticketToken),address(ticketNft));
    console.log("EventTicketing contract address at: ", address(eventTicket));



    vm.stopBroadcast();


  }
}