// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/TicketNft.sol";

contract TicketNftTest is Test {
    TicketNft ticketNft;
    address owner = address(0x1);
    address minter = address(0x2);
    address user = address(0x3);

    function setUp() public {
        vm.prank(owner);
        ticketNft = new TicketNft();
    }

    function testMintTicketAsOwner() public {
        vm.prank(owner);
        string memory tokenURI = "https://example.com/ticket/1";
        uint256 tokenId = ticketNft.mintTicket(user, tokenURI);

        assertEq(ticketNft.ownerOf(tokenId), user, "Ticket should be owned by user");
        assertEq(ticketNft.getTokenURI(tokenId), tokenURI, "Token URI should match");
    }

    function testMintTicketAsNonOwnerFails() public {
        vm.prank(minter);
        vm.expectRevert("Not authorized to mint");
        ticketNft.mintTicket(user, "https://example.com/ticket/1");
    }

    function testAuthorizeMinter() public {
        vm.prank(owner);
        ticketNft.authorizeMinter(minter);

        vm.prank(minter);
        string memory tokenURI = "https://example.com/ticket/2";
        uint256 tokenId = ticketNft.mintTicket(user, tokenURI);

        assertEq(ticketNft.ownerOf(tokenId), user, "Ticket should be owned by user");
        assertEq(ticketNft.getTokenURI(tokenId), tokenURI, "Token URI should match");
    }

    function testAuthorizeMinterZeroAddressFails() public {
        vm.prank(owner);
        vm.expectRevert("Invalid minter address");
        ticketNft.authorizeMinter(address(0));
    }

    function testGetTokenURI() public {
        vm.prank(owner);
        string memory tokenURI = "https://example.com/ticket/1";
        uint256 tokenId = ticketNft.mintTicket(user, tokenURI);

        assertEq(ticketNft.getTokenURI(tokenId), tokenURI, "Token URI should match");
    }
}