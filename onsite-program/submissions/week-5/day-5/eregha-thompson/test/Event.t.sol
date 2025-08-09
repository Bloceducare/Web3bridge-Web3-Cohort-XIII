// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import {Test, console} from "forge-std/Test.sol";
import {EventTicketing} from "../src/ticketing.sol";
import {TicketNft} from "../src/TicketNft.sol";
import {TicketToken} from "../src/TicketToken.sol";

contract EventTest is Test {
    EventTicketing public eventTicket;
    TicketNft nft;
    TicketToken token;


    address owner = address(0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC);
    address user = address(0x70997970C51812dc3A010C7d01b50e0d17dc79C8);
    address payable eventWallet = payable(0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266);


    function setUp() public {
        token = new TicketToken(1000000000000);
        nft = new TicketNft();

        eventTicket = new EventTicketing(address(nft), address(token));
         
    }

    function testcreateEvent() public {
       string memory _eventName= "the bridge";
        uint _amount= 1000;
        bool _Active =true;
        string memory _nftURI= "ipfs://QmTestCID";
        address _paymentAddress =eventWallet;
        
        eventTicket.createTicket(_eventName, _amount, _nftURI, _paymentAddress); 
        
        EventTicketing.TicketDetails[] memory tickets=eventTicket.getTickets();
        assertEq(tickets.length, 1);
        assertEq(tickets[0].eventName, _eventName);
    }

    function testUpdate() public{
        testcreateEvent();
        eventTicket.updateStatus(0);
        EventTicketing.TicketDetails[] memory tickets = eventTicket.getTickets();
        assertEq(tickets[0].Active, false);
    }


    function testBuyTickets() public{
        
        testcreateEvent();
        
        token.transfer(owner, 3000000);
        vm.prank(owner);
        token.approve(address(eventTicket), 400000);
        vm.prank(owner);
        eventTicket.buyTickets(0);
        EventTicketing.BuyTickets[] memory tickets = eventTicket.getBuyTickets(owner);
        assertEq(tickets[0]._buyer, owner);
        
    }
   
}
