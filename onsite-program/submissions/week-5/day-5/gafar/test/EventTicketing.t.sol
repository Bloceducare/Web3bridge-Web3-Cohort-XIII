// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {EventTicketing} from "../src/EventTicketing.sol";
import {TicketToken} from "../src/TicketToken.sol";
import {TicketNft} from "../src/TicketNft.sol";

struct Event {
    uint256 id;
    address creator;
    string name;
    string location;
    uint256 price;
    uint256 totalTickets;
    uint256 ticketsSold;
}

contract EventTicketingTest is Test {
    EventTicketing public eventTicketing;
    TicketToken public ticketToken;
    TicketNft public ticketNft;
    Event public liveEvent;
    
    address public paymentTokenAddress;
    address public ticketNftAddress;

    function deployEvent() public {
        uint256 initialSupply = 1_000_000 ether;
        ticketToken = new TicketToken(initialSupply);
        paymentTokenAddress = address(ticketToken);

        ticketNft = new TicketNft(address(this));
        ticketNftAddress = address(ticketNft);
    }

    function testInitialization() public {
        eventTicketing = new EventTicketing(paymentTokenAddress, ticketNftAddress);
        assertEq(address(eventTicketing.paymentToken()), paymentTokenAddress, "Payment token address should match");
        assertEq(address(eventTicketing.ticketNFT()), ticketNftAddress, "Ticket NFT address should match");
        assertEq(eventTicketing.nextEventId(), 0, "Next event ID should start at 0");
    }

    function testCreateEvent() public {
        eventTicketing = new EventTicketing(paymentTokenAddress, ticketNftAddress);
        
        string memory _name = "Web3 lagos";
        string memory _location = "Lagos";
        uint256 _price = 0.001 ether;
        uint256 _totalTickets = 1_000;

        uint256 expectedEventId = eventTicketing.nextEventId();

        eventTicketing.createEvent(_name, _location, _price, _totalTickets);

        (
            uint256 id,
            address creator,
            string memory name,
            string memory location,
            uint256 price,
            uint256 totalTickets,
            uint256 ticketsSold
        ) = eventTicketing.events(expectedEventId);

        // assertEq(totalTickets, , "Ticket ID should be the same as nextEventId");

        assertEq(id, expectedEventId, "Ticket ID should be the same as nextEventId");
        
        assertEq(address(creator), address(this), "Current Address have to be creator's address");
        
        assertEq(name, _name, "Event Name should be the same as Name passed");
        
        assertEq(location, _location, "Event Location should be the same as Given Location");
        
        assertEq(price, _price, "Ticket Price should be the same as Price set by creator");
        
        assertEq(totalTickets, _totalTickets, "Ticket Tickets should be the same as WHat the creator wanted");
        
        assertEq(ticketsSold, 0, "Ticket Sold should start from Zero");

        assertEq(eventTicketing.nextEventId(), expectedEventId + 1, "Ticket Sold should actually increment after successful creation");
    }

    function test_UpdateEvent() public {
        eventTicketing = new EventTicketing(paymentTokenAddress, ticketNftAddress);
        uint256 eventId = eventTicketing.nextEventId();
        
        eventTicketing.createEvent("Web3 Lagos", "Lagos", 0.001 ether, 1000);
        
        eventTicketing.updateEvent(eventId, "Updated Web3 Lagos", "Updated Lagos", 0.002 ether, 2000);
        
        _verifyEventUpdate(eventId, "Updated Web3 Lagos", "Updated Lagos", 0.002 ether, 2000);
    }
    
    function _verifyEventUpdate(
        uint256 eventId,
        string memory expectedName,
        string memory expectedLocation,
        uint256 expectedPrice,
        uint256 expectedTotal
    ) internal view {
        (
            uint256 id,
            address creator,
            string memory name,
            string memory location,
            uint256 price,
            uint256 totalTickets,
            uint256 ticketsSold
        ) = eventTicketing.events(eventId);
        
        assertEq(id, eventId, "Event ID should remain the same");
        assertEq(creator, address(this), "Creator should remain the same");
        assertEq(name, expectedName, "Name should be updated");
        assertEq(location, expectedLocation, "Location should be updated");
        assertEq(price, expectedPrice, "Price should be updated");
        assertEq(totalTickets, expectedTotal, "Total tickets should be updated");
        assertEq(ticketsSold, 0, "Tickets sold should remain 0");
    }

    function testDeleteEvent() public {
        eventTicketing = new EventTicketing(paymentTokenAddress, ticketNftAddress);
        uint256 eventId = eventTicketing.nextEventId();
        
        eventTicketing.createEvent("Web3 Lagos", "Lagos", 0.001 ether, 1000);
        eventTicketing.deleteEvent(eventId);
    }

    function testBuyTicket() public {
        // Deploy and setup
        eventTicketing = new EventTicketing(paymentTokenAddress, ticketNftAddress);

        uint256 eventId = eventTicketing.nextEventId();
        eventTicketing.createEvent("Web3 Lagos", "Lagos", 0.001 ether, 1000);

        // Fund buyer
        ticketToken.mint(address(this), 100_000 ether);

        // Approve contract to spend buyer's tokens
        ticketToken.approve(address(eventTicketing), 1 ether);

        (
            uint256 id,
            ,
            ,
            ,
            uint256 price,
            ,
            uint256 ticketsSoldBefore
        ) = eventTicketing.events(eventId);

        uint256 buyerBalanceBefore = ticketToken.balanceOf(address(this));

        // Buy ticket
        eventTicketing.buyTicket(id, "Qmevvws7eRjfiZrQNUWjvRVgxTib5ozpLr6WzHGvbA4HRd");

        uint256 buyerBalanceAfter = ticketToken.balanceOf(address(this));

        (, , , , , , uint256 ticketsSoldAfter) = eventTicketing.events(eventId);

        assertGe(buyerBalanceBefore, price, "Balance must be >= price before purchase");
        assertEq(buyerBalanceAfter, buyerBalanceBefore - price, "Balance should be reduced by price");
        assertEq(ticketsSoldAfter, ticketsSoldBefore + 1, "Tickets sold should increment by 1");
    }

}
