// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/EventFactory.sol";
import "../src/TicketToken.sol";
import "../src/TicketNFT.sol";

contract EventFactoryTest is Test {
    EventFactory public factory;
    address public owner;
    address public organizer;
    address public buyer;
    
    // Event parameters for testing
    string constant TOKEN_NAME = "EventToken";
    string constant TOKEN_SYMBOL = "EVT";
    uint256 constant TOKEN_SUPPLY = 1000 * 10**18; // 1000 tokens
    string constant NFT_NAME = "EventTicket";
    string constant NFT_SYMBOL = "TICKET";
    uint256 constant TICKET_PRICE = 10 * 10**18; // 10 tokens
    uint256 constant TOTAL_TICKETS = 100;
    uint256 constant EVENT_DURATION = 7 days;
    
    function setUp() public {
        // Set up test addresses
        owner = address(this); // Test contract is the owner
        organizer = makeAddr("organizer");
        buyer = makeAddr("buyer");
        
        // Deploy the factory
        factory = new EventFactory(owner);
        
        console.log("Factory deployed at:", address(factory));
        console.log("Owner:", factory.owner());
    }
    
    function testFactoryInitialState() public view {
        // Check initial state
        assertEq(factory.getEventCount(), 0);
        assertEq(factory.owner(), owner);
    }
    
    function testCreateEvent() public {
        uint256 eventEndDate = block.timestamp + EVENT_DURATION;
        uint256 startTimestamp = block.timestamp;
        
        // Create event as organizer
        vm.prank(organizer);
        (address erc20Address, address nftAddress) = factory.createEvent(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            TOKEN_SUPPLY,
            NFT_NAME,
            NFT_SYMBOL,
            TICKET_PRICE,
            TOTAL_TICKETS,
            eventEndDate
        );
        
        // Verify event was created
        assertEq(factory.getEventCount(), 1);
        
        // Get event info
        EventFactory.EventInfo memory eventInfo = factory.getEventById(0);
        
        // Verify event details
        assertEq(eventInfo.erc20Token, erc20Address);
        assertEq(eventInfo.nftTicket, nftAddress);
        assertEq(eventInfo.organizer, organizer);
        assertEq(eventInfo.ticketPrice, TICKET_PRICE);
        assertEq(eventInfo.totalTickets, TOTAL_TICKETS);
        assertEq(eventInfo.ticketsSold, 0);
        assertEq(eventInfo.eventStartDate, startTimestamp);
        assertEq(eventInfo.eventEndDate, eventEndDate);
        
        // Verify token was minted to organizer
        TicketToken token = TicketToken(erc20Address);
        assertEq(token.balanceOf(organizer), TOKEN_SUPPLY);
        assertEq(token.name(), TOKEN_NAME);
        assertEq(token.symbol(), TOKEN_SYMBOL);
        
        // Verify NFT contract was created with factory as owner
        BilalNFT nft = BilalNFT(nftAddress);
        assertEq(nft.owner(), address(factory));
        assertEq(nft.name(), NFT_NAME);
        assertEq(nft.symbol(), NFT_SYMBOL);
        
        console.log("Event created successfully!");
        console.log("ERC20 Token:", erc20Address);
        console.log("NFT Contract:", nftAddress);
    }
    
    function testBuyTicket() public {
        // First create an event
        uint256 eventEndDate = block.timestamp + EVENT_DURATION;
        
        vm.prank(organizer);
        (address erc20Address, address nftAddress) = factory.createEvent(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            TOKEN_SUPPLY,
            NFT_NAME,
            NFT_SYMBOL,
            TICKET_PRICE,
            TOTAL_TICKETS,
            eventEndDate
        );
        
        TicketToken token = TicketToken(erc20Address);
        BilalNFT nft = BilalNFT(nftAddress);
        
        // Give buyer some tokens and approve factory to spend them
        vm.prank(organizer);
        token.transfer(buyer, TICKET_PRICE * 2); // Give buyer enough for 2 tickets
        
        vm.prank(buyer);
        token.approve(address(factory), TICKET_PRICE);
        
        // Record balances before purchase
        uint256 buyerBalanceBefore = token.balanceOf(buyer);
        uint256 organizerBalanceBefore = token.balanceOf(organizer);
        uint256 buyerNFTBalanceBefore = nft.balanceOf(buyer);
        
        // Buy a ticket
        string memory tokenURI = "https://emerald-tropical-pinniped-712.mypinata.cloud/ipfs/bafkreic7ty3mmq26yncese7q6skvzhjllsj5vp5nvnzfhpu5p5lpol4uaq";
        vm.prank(buyer);
        factory.buyTicket(0, tokenURI);
        
        // Verify ticket purchase
        EventFactory.EventInfo memory eventInfo = factory.getEventById(0);
        assertEq(eventInfo.ticketsSold, 1);
        
        // Verify token transfer
        assertEq(token.balanceOf(buyer), buyerBalanceBefore - TICKET_PRICE);
        assertEq(token.balanceOf(organizer), organizerBalanceBefore + TICKET_PRICE);
        
        // Verify NFT was minted to buyer
        assertEq(nft.balanceOf(buyer), buyerNFTBalanceBefore + 1);
        assertEq(nft.ownerOf(0), buyer); // First NFT has tokenId 0
        assertEq(nft.tokenURI(0), tokenURI);
        
        console.log("Ticket purchased successfully!");
        console.log("Buyer NFT balance:", nft.balanceOf(buyer));
        console.log("Token URI:", nft.tokenURI(0));
    }
    
    function testBuyMultipleTickets() public {
        // Create event
        uint256 eventEndDate = block.timestamp + EVENT_DURATION;
        
        vm.prank(organizer);
        (address erc20Address, address nftAddress) = factory.createEvent(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            TOKEN_SUPPLY,
            NFT_NAME,
            NFT_SYMBOL,
            TICKET_PRICE,
            TOTAL_TICKETS,
            eventEndDate
        );
        
        TicketToken token = TicketToken(erc20Address);
        BilalNFT nft = BilalNFT(nftAddress);
        
        // Give buyer tokens and approve
        vm.prank(organizer);
        token.transfer(buyer, TICKET_PRICE * 3);
        
        vm.prank(buyer);
        token.approve(address(factory), TICKET_PRICE * 3);
        
        // Buy 3 tickets
        for (uint i = 0; i < 3; i++) {
            vm.prank(buyer);
            factory.buyTicket(0, string(abi.encodePacked("https://emerald-tropical-pinniped-712.mypinata.cloud/ipfs/bafkreic7ty3mmq26yncese7q6skvzhjllsj5vp5nvnzfhpu5p5lpol4uaq", vm.toString(i))));
        }
        
        // Verify
        EventFactory.EventInfo memory eventInfo = factory.getEventById(0);
        assertEq(eventInfo.ticketsSold, 3);
        assertEq(nft.balanceOf(buyer), 3);
        
        console.log("Multiple tickets purchased successfully!");
    }
    
    function testBuyTicketFailsWhenSoldOut() public {
        // Create event with only 1 ticket
        uint256 eventEndDate = block.timestamp + EVENT_DURATION;
        
        vm.prank(organizer);
        (address erc20Address,) = factory.createEvent(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            TOKEN_SUPPLY,
            NFT_NAME,
            NFT_SYMBOL,
            TICKET_PRICE,
            1, // Only 1 ticket available
            eventEndDate
        );
        
        TicketToken token = TicketToken(erc20Address);
        
        // Give buyer tokens
        vm.prank(organizer);
        token.transfer(buyer, TICKET_PRICE * 2);
        
        vm.prank(buyer);
        token.approve(address(factory), TICKET_PRICE * 2);
        
        // Buy the only available ticket
        vm.prank(buyer);
        factory.buyTicket(0, "ticket1");
        
        // Try to buy another ticket - should fail
        vm.expectRevert(EventFactory.ALL_TICKETS_SOLD.selector);
        vm.prank(buyer);
        factory.buyTicket(0, "ticket2");
        
        console.log("Sold out test passed!");
    }
    
    function testBuyTicketFailsWhenEventClosed() public {
        // Create event that ends in 1 second
        uint256 eventEndDate = block.timestamp + 1;
        
        vm.prank(organizer);
        (address erc20Address,) = factory.createEvent(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            TOKEN_SUPPLY,
            NFT_NAME,
            NFT_SYMBOL,
            TICKET_PRICE,
            TOTAL_TICKETS,
            eventEndDate
        );
        
        TicketToken token = TicketToken(erc20Address);
        
        // Give buyer tokens
        vm.prank(organizer);
        token.transfer(buyer, TICKET_PRICE);
        
        vm.prank(buyer);
        token.approve(address(factory), TICKET_PRICE);
        
        // Fast forward time to after event ends
        vm.warp(eventEndDate + 1);
        
        // Try to buy ticket - should fail
        vm.expectRevert(EventFactory.TICKET_CLOSED.selector);
        vm.prank(buyer);
        factory.buyTicket(0, "ticket");
        
        console.log("Event closed test passed!");
    }
    
    function testMintExtraNFT() public {
        // Create event
        uint256 eventEndDate = block.timestamp + EVENT_DURATION;
        
        vm.prank(organizer);
        (address erc20Address, address nftAddress) = factory.createEvent(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            TOKEN_SUPPLY,
            NFT_NAME,
            NFT_SYMBOL,
            TICKET_PRICE,
            TOTAL_TICKETS,
            eventEndDate
        );
        
        BilalNFT nft = BilalNFT(nftAddress);
        
        // Organizer mints extra NFT to buyer
        string memory tokenURI = "https://emerald-tropical-pinniped-712.mypinata.cloud/ipfs/bafkreic7ty3mmq26yncese7q6skvzhjllsj5vp5nvnzfhpu5p5lpol4uaq";
        vm.prank(organizer);
        factory.mintExtraNFT(0, buyer, tokenURI);
        
        // Verify NFT was minted
        assertEq(nft.balanceOf(buyer), 1);
        assertEq(nft.ownerOf(0), buyer);
        assertEq(nft.tokenURI(0), tokenURI);
        
        console.log("Extra NFT minted successfully!");
    }
    
    function testMintExtraNFTFailsForNonOrganizer() public {
        // Create event
        uint256 eventEndDate = block.timestamp + EVENT_DURATION;
        
        vm.prank(organizer);
        factory.createEvent(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            TOKEN_SUPPLY,
            NFT_NAME,
            NFT_SYMBOL,
            TICKET_PRICE,
            TOTAL_TICKETS,
            eventEndDate
        );
        
        // Non-organizer tries to mint extra NFT - should fail
        vm.expectRevert(EventFactory.ONLY_ORGANIZER_CAN_CALL.selector);
        vm.prank(buyer);
        factory.mintExtraNFT(0, buyer, "unauthorized");
        
        console.log("Unauthorized mint test passed!");
    }
    
    function testGetEventInfo() public {
        uint256 eventEndDate = block.timestamp + EVENT_DURATION;
        
        vm.prank(organizer);
        factory.createEvent(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            TOKEN_SUPPLY,
            NFT_NAME,
            NFT_SYMBOL,
            TICKET_PRICE,
            TOTAL_TICKETS,
            eventEndDate
        );
        
        // Test both getter functions
        EventFactory.EventInfo memory eventInfo1 = factory.getEventInfo(0);
        EventFactory.EventInfo memory eventInfo2 = factory.getEventById(0);
        
        // Both should return the same data
        assertEq(eventInfo1.organizer, eventInfo2.organizer);
        assertEq(eventInfo1.ticketPrice, eventInfo2.ticketPrice);
        assertEq(eventInfo1.totalTickets, eventInfo2.totalTickets);
        assertEq(eventInfo1.eventEndDate, eventInfo2.eventEndDate);
        
        console.log("Event info retrieval test passed!");
    }
}