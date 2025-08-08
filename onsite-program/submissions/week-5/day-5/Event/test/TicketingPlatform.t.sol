pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/EventToken.sol";
import "../src/TicketNFT.sol";
import "../src/TicketingPlatform.sol";

contract TicketingPlatformTest is Test {
    EventToken token;
    TicketNFT ticketNFT;
    TicketingPlatform platform;
    address user = address(0x1);
    address owner = address(this);
    uint256 ticketPrice = 100 * 10**18;
    string tokenURI = "https://ipfs.io/ipfs/QmTestMetadata";

    function setUp() public {
        // Deploy contracts
        token = new EventToken(1000 * 10**18);
        ticketNFT = new TicketNFT("Test Event");
        platform = new TicketingPlatform(address(token), address(ticketNFT), ticketPrice);
        ticketNFT.setTicketingPlatform(address(platform));

        // Transfer tokens to user
        token.transfer(user, 500 * 10**18);
    }

    function testBuyTicket() public {
        // User approves tokens
        vm.prank(user);
        token.approve(address(platform), ticketPrice);

        // User buys ticket
        vm.prank(user);
        platform.buyTicket(tokenURI);

        // Verify NFT ownership and metadata
        assertEq(ticketNFT.ownerOf(1), user);
        assertEq(ticketNFT.tokenURI(1), tokenURI);
        // Verify token balance
        assertEq(token.balanceOf(user), 400 * 10**18);
        assertEq(token.balanceOf(address(platform)), ticketPrice);
    }

    function test_RevertIf_InsufficientBalance() public {
        // Create a new user with no tokens
        address poorUser = address(0x2);
        vm.prank(poorUser);
        vm.expectRevert("Insufficient token balance");
        platform.buyTicket(tokenURI);
    }

    function testWithdrawTokens() public {
        // User buys ticket
        vm.prank(user);
        token.approve(address(platform), ticketPrice);
        vm.prank(user);
        platform.buyTicket(tokenURI);

        // Owner withdraws tokens
        uint256 initialBalance = token.balanceOf(owner);
        platform.withdrawTokens(ticketPrice);
        assertEq(token.balanceOf(owner), initialBalance + ticketPrice);
    }

    function test_RevertIf_UnauthorizedMint() public {
        vm.prank(user);
        vm.expectRevert(TicketNFT.NotTicketingPlatform.selector);
        ticketNFT.mintTicket(user, tokenURI);
    }
}