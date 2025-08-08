
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/TicketToken.sol";
import "../src/TicketNft.sol";
import "../src/EventTicketing.sol";

contract EventTicketingTest is Test {
    TicketToken token;
    TicketNft ticketNFT;
    EventTicketing eventTicketing;

    address owner = address(0x1);
    address user1 = address(0x2);
    address user2 = address(0x3);

    uint256 initialSupply = 1000000 * 10**18;
    uint256 ticketPrice = 100 * 10**18;

    event TicketPurchased(address indexed buyer, uint256 ticketId);

    function setUp() public {
        vm.startPrank(owner);
        token = new TicketToken(initialSupply);
        ticketNFT = new TicketNft();
        eventTicketing = new EventTicketing(
            address(token),
            address(ticketNFT),
            ticketPrice
        );
        ticketNFT.transferOwnership(address(eventTicketing));
        vm.stopPrank();
    }

    function test_InitialSetup() public {
        assertEq(token.balanceOf(owner), initialSupply, "Owner should have initial token supply");
        assertEq(ticketNFT.owner(), address(eventTicketing), "EventTicketing should own TicketNFT");
        assertEq(eventTicketing.ticketDetails(), ticketPrice, "Ticket price should be set");
        assertEq(eventTicketing.ticketsSold(), 0, "Tickets sold should be 0");
    }

    function test_MintTokens() public {
        vm.startPrank(owner);
        token.mint(user1, 1000 * 10**18);
        assertEq(token.balanceOf(user1), 1000 * 10**18, "User1 should receive minted tokens");
        vm.stopPrank();
    }

    function test_BuyTicket() public {
        vm.startPrank(owner);
        token.transfer(user1, ticketPrice);
        vm.stopPrank();

        vm.startPrank(user1);
        token.approve(address(eventTicketing), ticketPrice);
        vm.expectEmit(true, false, false, true);
        emit TicketPurchased(user1, 1);
        eventTicketing.buyTicket();
        vm.stopPrank();

        assertEq(token.balanceOf(user1), 0, "User1 should have spent tokens");
        assertEq(token.balanceOf(owner), initialSupply, "Owner should receive tokens");
        assertEq(ticketNFT.ownerOf(1), user1, "User1 should own NFT ticket");
        assertEq(eventTicketing.ticketsSold(), 1, "Tickets sold should be 1");
    }

    function test_BuyTicketInsufficientBalanceFails() public {
        vm.prank(user1);
        vm.expectRevert("Insufficient tokens");
        eventTicketing.buyTicket();
    }

    function test_BuyTicketInsufficientAllowanceFails() public {
        vm.startPrank(owner);
        token.transfer(user1, ticketPrice);
        vm.stopPrank();

        vm.prank(user1);
        vm.expectRevert("Token allowance too low");
        eventTicketing.buyTicket();
    }

    function test_SetTicketPrice() public {
        uint256 newPrice = 200 * 10**18;
        vm.prank(owner);
        eventTicketing.setTicketPrice(newPrice);
        assertEq(eventTicketing.ticketDetails(), newPrice, "Ticket price should be updated");
    }
}