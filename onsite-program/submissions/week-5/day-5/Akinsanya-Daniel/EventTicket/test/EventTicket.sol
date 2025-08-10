// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;


import {Test, console} from "forge-std/Test.sol";
import {EventTicket} from "../src/EventTicket.sol";
import{TicketNft} from "../src/TicketNft.sol";
import{TicketToken} from "../src/TicketToken.sol";

contract EventTicketTest is Test {
    EventTicket eventTicket;
    TicketNft ticketNft;
    TicketToken ticketToken;
    address user; 
    address ticketOwner;

    function setUp() public {
         user = 0x02AF376f613938A58c9567128E82bf3536a76F27;
        ticketOwner = 0x58A8D815eE6D1DDd027341650139B21c3258172b;
        vm.startPrank(user);

        ticketNft = new TicketNft();
        ticketToken = new  TicketToken(9000000000000000000);
        eventTicket = new EventTicket(address(ticketToken),address(ticketNft));
       
        ticketToken.transfer(ticketOwner, 4000000000000000000);
        vm.stopPrank();
    }

    function testCreateTicket() public {

        uint256 _ticketPrice = 1000000000000000000;
        string memory _eventName = "Olamide live in concert";
        address _ticketAddress = 0x02AF376f613938A58c9567128E82bf3536a76F27;
        string memory _nftUrl = "https://gateway.pinata.cloud/ipfs/bafkreif242dnhz6cibznuyvg6pmn4ncihugqsigl3vhr3ce4chqjkw36la";
        eventTicket.createTicket(_ticketPrice,_eventName, _ticketAddress, _nftUrl);
        assertEq(eventTicket.getTicket(1).ticketPrice, _ticketPrice);
        assertEq(eventTicket.getTicket(1).ticketOwner, _ticketAddress);
        assertEq(eventTicket.getTicket(1).ticketId,1);
    }


    function testCreateTicketwithinvalidAmount() public {
        uint256 _ticketPrice = 0;
        string memory _eventName= "Burna event";
        address _ticketAddress = 0x02AF376f613938A58c9567128E82bf3536a76F27;
        string memory _nftUrl = "https://gateway.pinata.cloud/ipfs/bafkreif242dnhz6cibznuyvg6pmn4ncihugqsigl3vhr3ce4chqjkw36la";

        vm.expectRevert(bytes("Ticket Price must be greater than zero"));
         eventTicket.createTicket(_ticketPrice,_eventName, _ticketAddress, _nftUrl);
    }

    function testPurchaseTicketSuccessfully()public {
        uint256 _ticketPrice = 1000000000000000000;
        string memory _eventName = "Olamide live in concert";
        address _ticketAddress = ticketOwner;
        string memory _nftUrl = "https://gateway.pinata.cloud/ipfs/bafkreif242dnhz6cibznuyvg6pmn4ncihugqsigl3vhr3ce4chqjkw36la";
        vm.prank(ticketOwner);
        eventTicket.createTicket(_ticketPrice, _eventName, _ticketAddress, _nftUrl);
        vm.prank(user);
        ticketToken.approve(address(eventTicket),_ticketPrice);
        uint256 userBalanceBefore = ticketToken.balanceOf(user);
        console.log("This is the user balance before");
        console.log(userBalanceBefore);
        uint256 ownerBalanceBefore = ticketToken.balanceOf(ticketOwner);
        console.log("This is the owner balance before");
        console.log(ownerBalanceBefore);
        vm.prank(user);
        eventTicket.purchaseTicket(1);
    
        uint256 userBalanceAfter = ticketToken.balanceOf(user);
        console.log("This is the user balance after");
        console.logUint(userBalanceAfter);
    
        uint256 ownerBalanceAfter = ticketToken.balanceOf(ticketOwner);
        console.log("This is the owner balance after"); 
        console.logUint(ownerBalanceAfter);
        assertEq(ticketToken.balanceOf(user), userBalanceBefore - _ticketPrice);
        assertEq(ticketToken.balanceOf(ticketOwner), ownerBalanceBefore + _ticketPrice);
        assertFalse(eventTicket.getTicket(1).isActive); 

    }
    


    function testPurchaseTicketWhenTicketIsNotAvailable()public{
    uint256 _ticketPrice = 1 ether;
    string memory _eventName = "Burna event";
    address _ticketOwner = makeAddr("ticketOwner"); 
    string memory _nftUrl = "https://example.com/ticket.json";

  
    vm.prank(ticketOwner);
    eventTicket.createTicket(_ticketPrice, _eventName, _ticketOwner, _nftUrl);


    vm.expectRevert(bytes("Ticket not available"));
    eventTicket.purchaseTicket(999); 


    }

    function testPurchaseTicketWhenBalanceIsLess()public{

    uint256 _ticketPrice = 9 ether;
    string memory _eventName = "Burna event";
    address _ticketAddress = ticketOwner;

    string memory _nftUrl = "https://example.com/ticket.json";

  
    vm.prank(ticketOwner);
   
    eventTicket.createTicket(_ticketPrice, _eventName, _ticketAddress, _nftUrl);
    vm.expectRevert(bytes("Insufficient token balance"));
    vm.prank(user);
    eventTicket.purchaseTicket(1); 
   


    
   


    }

    }

    

