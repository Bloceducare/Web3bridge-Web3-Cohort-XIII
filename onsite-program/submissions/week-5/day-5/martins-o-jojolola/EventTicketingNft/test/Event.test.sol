// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/EventTicketing.sol";

contract EventTicketingTest is Test {
    EventToken public eventToken;
    EventNFTs public eventNFTs;
    Event public eventContract;

    address public owner;
    address public user1;
    address public user2;
    address public validator;

    uint256 constant INITIAL_SUPPLY = 1_000_000;
    uint256 constant TICKET_PRICE = 100 * 10 ** 18;
    uint256 constant MAX_TICKETS = 1000;

    uint256 public eventId;

    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        validator = makeAddr("validator");

        eventToken = new EventToken("EventCoin", "EVC", INITIAL_SUPPLY);
        eventNFTs = new EventNFTs();
        eventContract = new Event(address(eventToken), address(eventNFTs));

        eventNFTs.transferOwnership(address(eventContract));

        eventContract.addValidator(validator);

        eventId = eventContract.createEvent(
            "Test Event",
            "A test event",
            TICKET_PRICE,
            MAX_TICKETS,
            block.timestamp + 1 hours,
            block.timestamp + 2 hours,
            "Test Venue",
            "https://test.metadata.uri"
        );

        eventToken.mint(user1, 1000 * 10 ** 18);
        eventToken.mint(user2, 500 * 10 ** 18);
    }

    function testEventCreation() public {
        Event.EventInfo memory eventInfo = eventContract.getEvent(eventId);

        assertEq(eventInfo.name, "Test Event");
        assertEq(eventInfo.ticketPrice, TICKET_PRICE);
        assertEq(eventInfo.maxTickets, MAX_TICKETS);
        assertEq(eventInfo.soldTickets, 0);
        assertTrue(eventInfo.isActive);
    }

    function testPurchaseTicket() public {
        vm.startPrank(user1);

        eventToken.approve(address(eventContract), TICKET_PRICE);

        uint256 tokenId = eventContract.purchaseTicket(eventId, msg.sender);

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

        vm.stopPrank();
    }

    function testPurchaseMultipleTickets() public {
        vm.startPrank(user1);

        uint256 quantity = 3;
        uint256 totalCost = TICKET_PRICE * quantity;

        eventToken.approve(address(eventContract), totalCost);

        uint256[] memory tokenIds = eventContract.purchaseMultipleTickets(
            eventId,
            quantity
        );

        assertEq(tokenIds.length, quantity);
        for (uint256 i = 0; i < quantity; i++) {
            assertEq(eventNFTs.ownerOf(tokenIds[i]), user1);
            assertEq(eventNFTs.getEventForTicket(tokenIds[i]), eventId);
            assertTrue(eventNFTs.isTicketValid(tokenIds[i]));
        }

        Event.EventInfo memory eventInfo = eventContract.getEvent(eventId);
        assertEq(eventInfo.soldTickets, quantity);

        vm.stopPrank();
    }

    function testValidateEntry() public {
        vm.startPrank(user1);
        eventToken.approve(address(eventContract), TICKET_PRICE);
        uint256 tokenId = eventContract.purchaseTicket(eventId, msg.sender);
        vm.stopPrank();

        vm.warp(block.timestamp + 1 hours);

        vm.prank(validator);
        bool canEnter = eventContract.validateEntry(tokenId);

        assertTrue(canEnter);
        assertFalse(eventNFTs.isTicketValid(tokenId));
    }

    function testCannotEnterWithUsedTicket() public {
        vm.startPrank(user1);
        eventToken.approve(address(eventContract), TICKET_PRICE);
        uint256 tokenId = eventContract.purchaseTicket(eventId, msg.sender);
        vm.stopPrank();

        vm.warp(block.timestamp + 1 hours);

        vm.prank(validator);
        eventContract.validateEntry(tokenId);

        vm.prank(validator);
        vm.expectRevert("Ticket is not valid or already used");
        eventContract.validateEntry(tokenId);
    }

    function testCannotPurchaseAfterEventStarts() public {
        vm.warp(block.timestamp + 2 hours);

        vm.startPrank(user1);
        eventToken.approve(address(eventContract), TICKET_PRICE);

        vm.expectRevert("Event has already started");
        eventContract.purchaseTicket(eventId, msg.sender);

        vm.stopPrank();
    }

    function testCannotEnterBeforeEventStarts() public {
        vm.startPrank(user1);
        eventToken.approve(address(eventContract), TICKET_PRICE);
        uint256 tokenId = eventContract.purchaseTicket(eventId, msg.sender);
        vm.stopPrank();

        vm.prank(validator);
        vm.expectRevert("Event is not currently active");
        eventContract.validateEntry(tokenId);
    }

    function testCannotEnterAfterEventEnds() public {
        vm.startPrank(user1);
        eventToken.approve(address(eventContract), TICKET_PRICE);
        uint256 tokenId = eventContract.purchaseTicket(eventId, msg.sender);
        vm.stopPrank();

        vm.warp(block.timestamp + 3 hours);

        vm.prank(validator);
        vm.expectRevert("Event is not currently active");
        eventContract.validateEntry(tokenId);
    }

    function testInsufficientTokens() public {
        vm.startPrank(user2);

        eventToken.approve(address(eventContract), TICKET_PRICE);

        vm.expectRevert("Insufficient token balance");
        eventContract.purchaseMultipleTickets(eventId, 6);

        vm.stopPrank();
    }

    function testSoldOut() public {
        uint256 smallEventId = eventContract.createEvent(
            "Small Event",
            "Limited tickets",
            TICKET_PRICE,
            2,
            block.timestamp + 1 hours,
            block.timestamp + 2 hours,
            "Small Venue",
            "https://small.metadata.uri"
        );

        vm.startPrank(user1);
        eventToken.approve(address(eventContract), TICKET_PRICE * 2);
        eventContract.purchaseMultipleTickets(smallEventId, 2);
        vm.stopPrank();

        vm.startPrank(user2);
        eventToken.approve(address(eventContract), TICKET_PRICE);

        vm.expectRevert("Event sold out");
        eventContract.purchaseTicket(smallEventId, msg.sender);

        vm.stopPrank();
    }

    function testOnlyValidatorCanValidateEntry() public {
        vm.startPrank(user1);
        eventToken.approve(address(eventContract), TICKET_PRICE);
        uint256 tokenId = eventContract.purchaseTicket(eventId, msg.sender);
        vm.stopPrank();

        vm.warp(block.timestamp + 1 hours);

        vm.prank(user2);
        vm.expectRevert("Not authorized validator");
        eventContract.validateEntry(tokenId);
    }

    function testToggleEventStatus() public {
        assertTrue(eventContract.getEvent(eventId).isActive);

        eventContract.toggleEventStatus(eventId);
        assertFalse(eventContract.getEvent(eventId).isActive);

        vm.startPrank(user1);
        eventToken.approve(address(eventContract), TICKET_PRICE);

        vm.expectRevert("Event is not active");
        eventContract.purchaseTicket(eventId, msg.sender);

        vm.stopPrank();
    }

    function testWithdrawTokens() public {
        vm.startPrank(user1);
        eventToken.approve(address(eventContract), TICKET_PRICE);
        eventContract.purchaseTicket(eventId, msg.sender);
        vm.stopPrank();

        uint256 ownerBalanceBefore = eventToken.balanceOf(owner);
        uint256 contractBalance = eventToken.balanceOf(address(eventContract));

        eventContract.withdrawTokens();

        uint256 ownerBalanceAfter = eventToken.balanceOf(owner);

        assertEq(ownerBalanceAfter - ownerBalanceBefore, contractBalance);
        assertEq(eventToken.balanceOf(address(eventContract)), 0);
    }

    function testGetActiveEvents() public {
        uint256 eventId2 = eventContract.createEvent(
            "Event 2",
            "Second event",
            TICKET_PRICE,
            MAX_TICKETS,
            block.timestamp + 3 hours,
            block.timestamp + 4 hours,
            "Venue 2",
            "https://event2.metadata.uri"
        );

        uint256 eventId3 = eventContract.createEvent(
            "Event 3",
            "Third event",
            TICKET_PRICE,
            MAX_TICKETS,
            block.timestamp + 5 hours,
            block.timestamp + 6 hours,
            "Venue 3",
            "https://event3.metadata.uri"
        );

        eventContract.toggleEventStatus(eventId3);

        uint256[] memory activeEvents = eventContract.getActiveEvents();

        assertEq(activeEvents.length, 2);
        assertEq(activeEvents[0], eventId);
        assertEq(activeEvents[1], eventId2);
    }

    function testCanEnterEvent() public {
        vm.startPrank(user1);
        eventToken.approve(address(eventContract), TICKET_PRICE);
        uint256 tokenId = eventContract.purchaseTicket(eventId, msg.sender);
        vm.stopPrank();

        (bool canEnter, string memory reason) = eventContract.canEnterEvent(
            tokenId
        );
        assertFalse(canEnter);
        assertEq(reason, "Event has not started yet");

        vm.warp(block.timestamp + 1.5 hours);
        (canEnter, reason) = eventContract.canEnterEvent(tokenId);
        assertTrue(canEnter);
        assertEq(reason, "Ticket is valid for entry");

        vm.warp(block.timestamp + 3 hours);
        (canEnter, reason) = eventContract.canEnterEvent(tokenId);
        assertFalse(canEnter);
        assertEq(reason, "Event has ended");
    }

    function testIsTicketHolder() public {
        assertFalse(eventContract.isTicketHolder(eventId, user1));

        vm.startPrank(user1);
        eventToken.approve(address(eventContract), TICKET_PRICE);
        eventContract.purchaseTicket(eventId, msg.sender);
        vm.stopPrank();

        assertTrue(eventContract.isTicketHolder(eventId, user1));
        assertFalse(eventContract.isTicketHolder(eventId, user2));
    }

    function testEventNFTFunctionality() public {
        vm.startPrank(user1);
        eventToken.approve(address(eventContract), TICKET_PRICE);
        uint256 tokenId = eventContract.purchaseTicket(eventId, msg.sender);
        vm.stopPrank();

        assertEq(eventNFTs.name(), "EventTicket");
        assertEq(eventNFTs.symbol(), "ETKT");
        assertEq(eventNFTs.ownerOf(tokenId), user1);
        assertEq(eventNFTs.tokenURI(tokenId), "https://test.metadata.uri");

        assertEq(eventNFTs.getEventForTicket(tokenId), eventId);
        uint256[] memory eventTokens = eventNFTs.getEventTickets(eventId);
        assertEq(eventTokens.length, 1);
        assertEq(eventTokens[0], tokenId);

        assertEq(eventNFTs.totalSupply(), 1);
    }

    function testEventTokenFunctionality() public {
        assertEq(eventToken.name(), "EventCoin");
        assertEq(eventToken.symbol(), "EVC");
        assertEq(eventToken.decimals(), 18);

        uint256 expectedSupply = INITIAL_SUPPLY *
            10 ** 18 +
            1000 *
            10 ** 18 +
            500 *
            10 ** 18;
        assertEq(eventToken.totalSupply(), expectedSupply);

        uint256 burnAmount = 100 * 10 ** 18;
        vm.prank(user1);
        eventToken.burn(burnAmount);

        assertEq(eventToken.balanceOf(user1), 900 * 10 ** 18);
        assertEq(eventToken.totalSupply(), expectedSupply - burnAmount);
    }

    function testFailPurchaseWithoutApproval() public {
        vm.prank(user1);
        eventContract.purchaseTicket(eventId, msg.sender);
    }

    function testFailCreateEventInPast() public {
        vm.expectRevert("Start time must be in the future");
        eventContract.createEvent(
            "Past Event",
            "This should fail",
            TICKET_PRICE,
            MAX_TICKETS,
            block.timestamp - 1 hours,
            block.timestamp + 1 hours,
            "Past Venue",
            "https://past.metadata.uri"
        );
    }

    function testFailCreateEventWithEndBeforeStart() public {
        vm.expectRevert("End time must be after start time");
        eventContract.createEvent(
            "Invalid Event",
            "This should fail",
            TICKET_PRICE,
            MAX_TICKETS,
            block.timestamp + 2 hours,
            block.timestamp + 1 hours,
            "Invalid Venue",
            "https://invalid.metadata.uri"
        );
    }

    function testFailPurchaseTooManyTickets() public {
        vm.startPrank(user1);
        eventToken.approve(address(eventContract), TICKET_PRICE * 20);

        vm.expectRevert("Invalid quantity (1-10)");
        eventContract.purchaseMultipleTickets(eventId, 15);

        vm.stopPrank();
    }

    receive() external payable {}
}
