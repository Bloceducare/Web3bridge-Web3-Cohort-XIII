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
    address user = address(0x1234); 
    address ticketOwner = 0x02AF376f613938A58c9567128E82bf3536a76F27;

    function setUp() public {
        ticketNft = new TicketNft();
        ticketToken = new  TicketToken(2000000000000000000);
        eventTicket = new EventTicket(address(ticketNft),address(ticketToken));
        vm.prank(address(this));
        ticketToken.transfer(user, 2000000000000000000);
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

    // function testPurchaseTicketSuccessfully()public {
    //     uint256 _ticketPrice = 1000000000000000000;
    //     string memory _eventName = "Olamide live in concert";
    //     address _ticketAddress = 0x02AF376f613938A58c9567128E82bf3536a76F27;
    //     string memory _nftUrl = "https://gateway.pinata.cloud/ipfs/bafkreif242dnhz6cibznuyvg6pmn4ncihugqsigl3vhr3ce4chqjkw36la";
    //     vm.prank(ticketOwner);
    //     eventTicket.createTicket(_ticketPrice, _eventName, _ticketAddress, _nftUrl);
    
    
    //    deal(address(ticketToken), user, _ticketPrice); 
    //    vm.prank(user);
    //    ticketToken.approve(address(eventTicket), _ticketPrice); 
    
  
    //    uint256 userBalanceBefore = ticketToken.balanceOf(user);
    //    uint256 ownerBalanceBefore = ticketToken.balanceOf(_ticketAddress);
    

    //   vm.prank(user);
    //   eventTicket.purchaseTicket(1); 
    
   
    //   assertEq(ticketToken.balanceOf(user), userBalanceBefore - _ticketPrice);
    //   assertEq(ticketToken.balanceOf(_ticketAddress), ownerBalanceBefore + _ticketPrice);
    //   assertFalse(eventTicket.getTicket(1).isActive); 



    // }

    function testPurchaseTicketWhenTicketIsNotAvailable()public{
    uint256 _ticketPrice = 1 ether;
    string memory _eventName = "Burna event";
    address _ticketOwner = makeAddr("ticketOwner"); 
    string memory _nftUrl = "https://example.com/ticket.json";

  
    vm.prank(ticketOwner);
    eventTicket.createTicket(_ticketPrice, _eventName, _ticketOwner, _nftUrl);


    vm.expectRevert(bytes("ticket not available"));
    eventTicket.purchaseTicket(999); 


    }

    
}
