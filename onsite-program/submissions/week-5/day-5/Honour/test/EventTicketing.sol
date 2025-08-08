// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/EventTicketing.sol";
import "../src/TicketNft.sol";
import "../src/TicketToken.sol";

contract EventTicketingTest is Test {
    EventTicketing public eventTicketing;
    TicketNft public ticketNft;
    TicketToken public ticketToken;

    address public owner;
    address public alice;
    address public bob;

    function setUp() public {
        owner = address(this);
        alice = address(0xA1);
        bob = address(0xB2);

        ticketNft = new TicketNft(owner);
        ticketToken = new TicketToken(1000 ether);
        eventTicketing = new EventTicketing(1 ether, address(ticketNft), address(ticketToken));
        ticketNft.transferOwnership(address(eventTicketing)); // give minting control
    }

    function test_BuyTicketSuccessful() public {
        vm.deal(alice, 2 ether);

        vm.prank(alice);
        eventTicketing.buyTicket{value: 1 ether}("My Ticket", alice);

        (uint256 id,, uint256 price, address currentOwner) = eventTicketing.tickets(1);

        assertEq(id, 1);
        assertEq(price, 1 ether);
        assertEq(currentOwner, alice);
        assertEq(ticketNft.ownerOf(1), alice);
    }

    function test_MintTicketByOwner() public {
        eventTicketing.mintTicket("Admin Ticket");

        (uint256 id,, uint256 price, address currentOwner) = eventTicketing.tickets(1);

        assertEq(id, 1);
        assertEq(price, 0);
        assertEq(currentOwner, owner);
        assertEq(ticketNft.ownerOf(1), owner);
    }

    function onERC721Received( address, address, uint256, bytes calldata) external pure returns (bytes4) {
    return this.onERC721Received.selector;
}

    function test_TotalSupplyAfterMint() public {
        eventTicketing.mintTicket("T1");
        eventTicketing.mintTicket("T2");
        eventTicketing.mintTicket("T3");

        assertEq(eventTicketing.totalSupply(), 3);
    }

    

    function test_RevertWhen_BuyWithZeroAddress() public {
        vm.deal(bob, 1 ether);
        vm.prank(bob);
        vm.expectRevert("Invalid address");
        eventTicketing.buyTicket{value: 1 ether}("Invalid", address(0));
    }

    function test_RevertWhen_NotOwnerCallsMintTicket() public {
        vm.prank(alice);
        vm.expectRevert("Not the contract owner");
        eventTicketing.mintTicket("Should Fail");
    }

    function test_RevertWhen_NotOwnerCallsWithdraw() public {
        vm.prank(bob);
        vm.expectRevert("Not the contract owner");
        eventTicketing.withdraw();
    }
}
