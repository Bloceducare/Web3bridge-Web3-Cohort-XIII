// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/Event.sol";
import "../src/EventToken.sol";
import "../src/EventNFTs.sol";

contract EventTest is Test {
    Event public eventContract;
    EventToken public eventToken;
    EventNFTs public eventNFTs;

    address public owner = address(1);
    address public user1 = address(2);
    address public user2 = address(3);
    address public validator = address(4);

    uint256 constant INITIAL_SUPPLY = 1_000_000 * 1e18;
    uint256 constant USER_BALANCE = 10_000 * 1e18;

    string constant EVENT_NAME = "Test Concert";
    string constant EVENT_DESCRIPTION = "A great concert";
    uint256 constant TICKET_PRICE = 100 * 1e18;
    uint256 constant MAX_TICKETS = 100;
    string constant VENUE = "Test Arena";
    string constant METADATA_URI = "ipfs://test-metadata";

    uint256 public eventId;
    uint256 public startTime;
    uint256 public endTime;

    function setUp() public {
        vm.startPrank(owner);

        eventToken = new EventToken("EventToken", "ETK", INITIAL_SUPPLY / 1e18);
        eventNFTs = new EventNFTs();
        eventContract = new Event(address(eventToken), address(eventNFTs));

        eventNFTs.transferOwnership(address(eventContract));

        startTime = block.timestamp + 1 days;
        endTime = startTime + 1 days;

        eventId = eventContract.createEvent(
            EVENT_NAME,
            EVENT_DESCRIPTION,
            TICKET_PRICE,
            MAX_TICKETS,
            startTime,
            endTime,
            VENUE,
            METADATA_URI
        );

        eventContract.addValidator(validator);

        eventToken.transfer(user1, USER_BALANCE);
        eventToken.transfer(user2, USER_BALANCE);

        vm.stopPrank();

        vm.prank(user1);
        eventToken.approve(address(eventContract), type(uint256).max);

        vm.prank(user2);
        eventToken.approve(address(eventContract), type(uint256).max);
    }

    function testInitialSetup() public view {
        assertEq(eventToken.totalSupply(), INITIAL_SUPPLY);
        assertEq(
            eventToken.balanceOf(owner),
            INITIAL_SUPPLY - USER_BALANCE * 2
        );
        assertEq(eventToken.balanceOf(user1), USER_BALANCE);
        assertEq(eventToken.balanceOf(user2), USER_BALANCE);
        assertEq(eventContract.getTotalEvents(), 1);
    }

    function testCreateEvent() public {
        vm.startPrank(owner);

        uint256 newEventId = eventContract.createEvent(
            "New Event",
            "Description",
            50 * 1e18,
            200,
            block.timestamp + 2 days,
            block.timestamp + 3 days,
            "New Venue",
            "ipfs://new-metadata"
        );

        assertEq(newEventId, 1);
        assertEq(eventContract.getTotalEvents(), 2);

        Event.EventInfo memory eventInfo = eventContract.getEvent(newEventId);
        assertEq(eventInfo.name, "New Event");
        assertEq(eventInfo.ticketPrice, 50 * 1e18);
        assertEq(eventInfo.maxTickets, 200);
        assertTrue(eventInfo.isActive);

        vm.stopPrank();
    }

    function testCreateEventFailures() public {
        vm.startPrank(owner);

        vm.expectRevert("Start time must be in the future");
        eventContract.createEvent(
            "Past Event",
            "Description",
            TICKET_PRICE,
            MAX_TICKETS,
            block.timestamp - 1,
            block.timestamp + 1 days,
            VENUE,
            METADATA_URI
        );

        vm.expectRevert("End time must be after start time");
        eventContract.createEvent(
            "Invalid Time Event",
            "Description",
            TICKET_PRICE,
            MAX_TICKETS,
            block.timestamp + 2 days,
            block.timestamp + 1 days,
            VENUE,
            METADATA_URI
        );

        vm.expectRevert("Max tickets must be greater than 0");
        eventContract.createEvent(
            "Zero Tickets Event",
            "Description",
            TICKET_PRICE,
            0,
            startTime,
            endTime,
            VENUE,
            METADATA_URI
        );

        vm.stopPrank();
    }

    function testCreateEventUnauthorized() public {
        vm.prank(user1);
        vm.expectRevert(
            abi.encodeWithSignature(
                "OwnableUnauthorizedAccount(address)",
                user1
            )
        );
        eventContract.createEvent(
            "Unauthorized Event",
            "Description",
            TICKET_PRICE,
            MAX_TICKETS,
            startTime,
            endTime,
            VENUE,
            METADATA_URI
        );
    }

    function testPurchaseTicket() public {
        vm.prank(user1);
        uint256 tokenId = eventContract.purchaseTicket(eventId);

        assertEq(eventNFTs.ownerOf(tokenId), user1);
        assertEq(eventNFTs.getEventForTicket(tokenId), eventId);
        assertTrue(eventNFTs.isTicketValid(tokenId));

        Event.EventInfo memory eventInfo = eventContract.getEvent(eventId);
        assertEq(eventInfo.soldTickets, 1);

        uint256[] memory userTickets = eventContract.getUserTickets(
            eventId,
            user1
        );
        assertEq(userTickets.length, 1);
        assertEq(userTickets[0], tokenId);

        assertEq(eventToken.balanceOf(user1), USER_BALANCE - TICKET_PRICE);
        assertEq(eventToken.balanceOf(address(eventContract)), TICKET_PRICE);
    }

    function testPurchaseMultipleTickets() public {
        uint256 quantity = 3;

        vm.prank(user1);
        uint256[] memory tokenIds = eventContract.purchaseMultipleTickets(
            eventId,
            quantity
        );

        assertEq(tokenIds.length, quantity);

        for (uint256 i = 0; i < quantity; i++) {
            assertEq(eventNFTs.ownerOf(tokenIds[i]), user1);
            assertTrue(eventNFTs.isTicketValid(tokenIds[i]));
        }

        Event.EventInfo memory eventInfo = eventContract.getEvent(eventId);
        assertEq(eventInfo.soldTickets, quantity);

        uint256[] memory userTickets = eventContract.getUserTickets(
            eventId,
            user1
        );
        assertEq(userTickets.length, quantity);

        assertEq(
            eventToken.balanceOf(user1),
            USER_BALANCE - (TICKET_PRICE * quantity)
        );
        assertEq(
            eventToken.balanceOf(address(eventContract)),
            TICKET_PRICE * quantity
        );
    }

    function testPurchaseTicketFailures() public {
        vm.prank(user1);
        vm.expectRevert("Event does not exist");
        eventContract.purchaseTicket(999);

        vm.prank(owner);
        eventContract.toggleEventStatus(eventId);

        vm.prank(user1);
        vm.expectRevert("Event is not active");
        eventContract.purchaseTicket(eventId);

        vm.prank(owner);
        eventContract.toggleEventStatus(eventId);

        vm.prank(user1);
        eventToken.transfer(user2, USER_BALANCE - TICKET_PRICE + 1);

        vm.prank(user1);
        vm.expectRevert("Insufficient token balance");
        eventContract.purchaseTicket(eventId);

        vm.prank(user2);
        eventToken.transfer(user1, USER_BALANCE - TICKET_PRICE + 1);

        vm.prank(user1);
        eventToken.approve(address(eventContract), TICKET_PRICE - 1);

        vm.prank(user1);
        vm.expectRevert("Insufficient token allowance");
        eventContract.purchaseTicket(eventId);

        vm.prank(user1);
        eventToken.approve(address(eventContract), type(uint256).max);

        vm.warp(startTime + 1);

        vm.prank(user1);
        vm.expectRevert("Event has already started");
        eventContract.purchaseTicket(eventId);
    }

    function testSoldOut() public {
        vm.prank(owner);
        uint256 smallEventId = eventContract.createEvent(
            "Small Event",
            "Limited tickets",
            TICKET_PRICE,
            2,
            startTime,
            endTime,
            VENUE,
            METADATA_URI
        );

        vm.prank(user1);
        eventContract.purchaseTicket(smallEventId);

        vm.prank(user2);
        eventContract.purchaseTicket(smallEventId);

        vm.prank(user1);
        vm.expectRevert("Event sold out");
        eventContract.purchaseTicket(smallEventId);
    }

    function testPurchaseMultipleTicketsFailures() public {
        vm.prank(user1);
        vm.expectRevert("Invalid quantity (1-10)");
        eventContract.purchaseMultipleTickets(eventId, 0);

        vm.prank(user1);
        vm.expectRevert("Invalid quantity (1-10)");
        eventContract.purchaseMultipleTickets(eventId, 11);

        vm.prank(owner);
        uint256 limitedEventId = eventContract.createEvent(
            "Limited Event",
            "Only 2 tickets",
            TICKET_PRICE,
            2,
            startTime,
            endTime,
            VENUE,
            METADATA_URI
        );

        vm.prank(user1);
        vm.expectRevert("Not enough tickets available");
        eventContract.purchaseMultipleTickets(limitedEventId, 3);
    }

    function testValidateEntry() public {
        vm.prank(user1);
        uint256 tokenId = eventContract.purchaseTicket(eventId);

        vm.warp(startTime + 1 hours);

        vm.prank(validator);
        bool success = eventContract.validateEntry(tokenId);
        assertTrue(success);

        assertFalse(eventNFTs.isTicketValid(tokenId));

        vm.prank(validator);
        vm.expectRevert("Ticket is not valid or already used");
        eventContract.validateEntry(tokenId);
    }

    function testValidateEntryFailures() public {
        vm.prank(validator);
        vm.expectRevert("ERC721NonexistentToken(999)");
        eventContract.validateEntry(999);

        vm.prank(user1);
        uint256 tokenId = eventContract.purchaseTicket(eventId);

        vm.prank(user2);
        vm.expectRevert("Not authorized validator");
        eventContract.validateEntry(tokenId);

        vm.prank(owner);
        eventContract.toggleEventStatus(eventId);

        vm.warp(startTime + 1 hours);
        vm.prank(validator);
        vm.expectRevert("Event is not active");
        eventContract.validateEntry(tokenId);

        vm.prank(owner);
        eventContract.toggleEventStatus(eventId);

        vm.warp(startTime - 1 hours);
        vm.prank(validator);
        vm.expectRevert("Event is not currently active");
        eventContract.validateEntry(tokenId);

        vm.warp(endTime + 1 hours);
        vm.prank(validator);
        vm.expectRevert("Event is not currently active");
        eventContract.validateEntry(tokenId);
    }

    function testCanEnterEvent() public {
        vm.prank(user1);
        uint256 tokenId = eventContract.purchaseTicket(eventId);

        (bool canEnter, string memory reason) = eventContract.canEnterEvent(
            tokenId
        );
        assertFalse(canEnter);
        assertEq(reason, "Event has not started yet");

        vm.warp(startTime + 1 hours);
        (canEnter, reason) = eventContract.canEnterEvent(tokenId);
        assertTrue(canEnter);
        assertEq(reason, "Ticket is valid for entry");

        vm.prank(validator);
        eventContract.validateEntry(tokenId);

        (canEnter, reason) = eventContract.canEnterEvent(tokenId);
        assertFalse(canEnter);
        assertEq(reason, "Ticket is not valid or already used");

        vm.warp(startTime - 1 hours);
        vm.prank(user1);
        uint256 tokenId2 = eventContract.purchaseTicket(eventId);

        vm.warp(endTime + 1 hours);
        (canEnter, reason) = eventContract.canEnterEvent(tokenId2);
        assertFalse(canEnter);
        assertEq(reason, "Event has ended");
    }

    function testValidatorManagement() public {
        address newValidator = address(5);

        vm.prank(owner);
        eventContract.addValidator(newValidator);

        vm.prank(user1);
        uint256 tokenId = eventContract.purchaseTicket(eventId);

        vm.warp(startTime + 1 hours);

        vm.prank(newValidator);
        bool success = eventContract.validateEntry(tokenId);
        assertTrue(success);

        vm.prank(owner);
        eventContract.removeValidator(newValidator);

        vm.warp(startTime - 1 hours);
        vm.prank(user1);
        uint256 tokenId2 = eventContract.purchaseTicket(eventId);

        vm.warp(startTime + 1 hours);

        vm.prank(newValidator);
        vm.expectRevert("Not authorized validator");
        eventContract.validateEntry(tokenId2);
    }

    function testWithdrawTokens() public {
        vm.prank(user1);
        eventContract.purchaseTicket(eventId);

        vm.prank(user2);
        eventContract.purchaseTicket(eventId);

        uint256 contractBalance = eventToken.balanceOf(address(eventContract));
        uint256 ownerBalanceBefore = eventToken.balanceOf(owner);

        vm.prank(owner);
        eventContract.withdrawTokens();

        assertEq(eventToken.balanceOf(address(eventContract)), 0);
        assertEq(
            eventToken.balanceOf(owner),
            ownerBalanceBefore + contractBalance
        );
    }

    function testGetActiveEvents() public {
        vm.startPrank(owner);
        uint256 event2 = eventContract.createEvent(
            "Event 2",
            "Description 2",
            TICKET_PRICE,
            MAX_TICKETS,
            startTime,
            endTime,
            VENUE,
            METADATA_URI
        );

        uint256 event3 = eventContract.createEvent(
            "Event 3",
            "Description 3",
            TICKET_PRICE,
            MAX_TICKETS,
            startTime,
            endTime,
            VENUE,
            METADATA_URI
        );

        eventContract.toggleEventStatus(eventId);
        vm.stopPrank();

        uint256[] memory activeEvents = eventContract.getActiveEvents();
        assertEq(activeEvents.length, 2);
        assertEq(activeEvents[0], event2);
        assertEq(activeEvents[1], event3);
    }

    function testIsTicketHolder() public {
        assertFalse(eventContract.isTicketHolder(eventId, user1));

        vm.prank(user1);
        eventContract.purchaseTicket(eventId);

        assertTrue(eventContract.isTicketHolder(eventId, user1));
        assertFalse(eventContract.isTicketHolder(eventId, user2));
    }

    function testEventNFTsDirectly() public {
        vm.prank(user1);
        vm.expectRevert(
            abi.encodeWithSignature(
                "OwnableUnauthorizedAccount(address)",
                user1
            )
        );
        eventNFTs.mintTicket(user1, eventId, METADATA_URI);

        vm.prank(user1);
        uint256 tokenId = eventContract.purchaseTicket(eventId);

        EventNFTs.Ticket memory ticket = eventNFTs.getTicketInfo(tokenId);
        assertEq(ticket.eventId, eventId);
        assertFalse(ticket.used);
        assertEq(ticket.mintTimestamp, block.timestamp);

        uint256[] memory userEventTickets = eventNFTs.getUserTicketsForEvent(
            user1,
            eventId
        );
        assertEq(userEventTickets.length, 1);
        assertEq(userEventTickets[0], tokenId);

        uint256[] memory eventTickets = eventNFTs.getEventTickets(eventId);
        assertEq(eventTickets.length, 1);
        assertEq(eventTickets[0], tokenId);
    }

    function testReentrancyProtection() public {
        vm.prank(user1);
        uint256 tokenId = eventContract.purchaseTicket(eventId);
        assertGt(tokenId, 0);

        vm.warp(block.timestamp);

        vm.prank(user1);
        uint256[] memory tokenIds = eventContract.purchaseMultipleTickets(
            eventId,
            2
        );
        assertEq(tokenIds.length, 2);

        for (uint256 i = 0; i < tokenIds.length; i++) {
            assertGt(tokenIds[i], 0);
            assertTrue(eventNFTs.isTicketValid(tokenIds[i]));
        }
    }

    function testLargeScaleTicketPurchase() public {
        vm.prank(owner);
        uint256 largeEventId = eventContract.createEvent(
            "Large Event",
            "Many tickets",
            TICKET_PRICE,
            1000,
            startTime,
            endTime,
            VENUE,
            METADATA_URI
        );

        vm.prank(owner);
        eventToken.mint(user1, TICKET_PRICE * 100);

        vm.prank(user1);
        eventToken.approve(address(eventContract), type(uint256).max);

        vm.prank(user1);
        uint256[] memory tokenIds = eventContract.purchaseMultipleTickets(
            largeEventId,
            10
        );
        assertEq(tokenIds.length, 10);

        Event.EventInfo memory eventInfo = eventContract.getEvent(largeEventId);
        assertEq(eventInfo.soldTickets, 10);
    }

    function testEventTokenBurnability() public {
        uint256 burnAmount = 100 * 1e18;
        uint256 balanceBefore = eventToken.balanceOf(user1);

        vm.prank(user1);
        eventToken.burn(burnAmount);

        assertEq(eventToken.balanceOf(user1), balanceBefore - burnAmount);
    }

    function testEventTokenMinting() public {
        uint256 mintAmount = 500 * 1e18;
        uint256 balanceBefore = eventToken.balanceOf(user1);

        vm.prank(owner);
        eventToken.mint(user1, mintAmount);

        assertEq(eventToken.balanceOf(user1), balanceBefore + mintAmount);

        vm.prank(user1);
        vm.expectRevert(
            abi.encodeWithSignature(
                "OwnableUnauthorizedAccount(address)",
                user1
            )
        );
        eventToken.mint(user1, mintAmount);
    }

    receive() external payable {}
}
