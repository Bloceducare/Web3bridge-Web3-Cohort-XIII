// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/RolesRegistry.sol";
import "../src/DAONFT.sol";

contract DAONFTTest is Test {
    RolesRegistry public rolesRegistry;
    DAONFT public nft;
    
    address public alice = address(0x1);
    address public bob = address(0x2);
    address public carol = address(0x3);
    
    function setUp() public {
        rolesRegistry = new RolesRegistry();
        nft = new DAONFT("TestNFT", "TNFT", address(rolesRegistry));
    }
    
    function testConstructor() public view {
        assertEq(nft.name(), "TestNFT");
        assertEq(nft.symbol(), "TNFT");
        assertEq(address(nft.rolesRegistry()), address(rolesRegistry));
    }
    
    function testMint() public {
        nft.mint(alice);
        
        assertEq(nft.ownerOf(0), alice);
        assertEq(nft.balanceOf(alice), 1);
    }
    
    function testMintMultiple() public {
        nft.mint(alice);
        nft.mint(bob);
        nft.mint(carol);
        
        assertEq(nft.ownerOf(0), alice);
        assertEq(nft.ownerOf(1), bob);
        assertEq(nft.ownerOf(2), carol);
        
        assertEq(nft.balanceOf(alice), 1);
        assertEq(nft.balanceOf(bob), 1);
        assertEq(nft.balanceOf(carol), 1);
    }
    
    function testBalanceOfZeroAddress() public {
        vm.expectRevert("ERC721: balance query for zero address");
        nft.balanceOf(address(0));
    }
    
    function testOwnerOfNonexistentToken() public {
        vm.expectRevert("ERC721: owner query for nonexistent token");
        nft.ownerOf(999);
    }
    
    function testApprove() public {
        nft.mint(alice);
        
        vm.prank(alice);
        nft.approve(bob, 0);
        
        assertEq(nft.getApproved(0), bob);
    }
    
    function testApproveToOwner() public {
        nft.mint(alice);
        
        vm.prank(alice);
        vm.expectRevert("ERC721: approval to current owner");
        nft.approve(alice, 0);
    }
    
    function testApproveNotOwner() public {
        nft.mint(alice);
        
        vm.prank(bob);
        vm.expectRevert("ERC721: approve caller is not owner nor approved for all");
        nft.approve(carol, 0);
    }
    
    function testGetApprovedNonexistentToken() public {
        vm.expectRevert("ERC721: approved query for nonexistent token");
        nft.getApproved(999);
    }
    
    function testSetApprovalForAll() public {
        vm.prank(alice);
        nft.setApprovalForAll(bob, true);
        
        assertTrue(nft.isApprovedForAll(alice, bob));
    }
    
    function testSetApprovalForAllToSelf() public {
        vm.prank(alice);
        vm.expectRevert("ERC721: approve to caller");
        nft.setApprovalForAll(alice, true);
    }
    
    function testTransferFrom() public {
        nft.mint(alice);
        
        vm.prank(alice);
        nft.transferFrom(alice, bob, 0);
        
        assertEq(nft.ownerOf(0), bob);
        assertEq(nft.balanceOf(alice), 0);
        assertEq(nft.balanceOf(bob), 1);
    }
    
    function testTransferFromNotOwner() public {
        nft.mint(alice);
        
        vm.prank(bob);
        vm.expectRevert("ERC721: transfer caller is not owner nor approved");
        nft.transferFrom(alice, carol, 0);
    }
    
    function testTransferFromIncorrectOwner() public {
        nft.mint(alice);
        
        vm.prank(alice);
        vm.expectRevert("ERC721: transfer from incorrect owner");
        nft.transferFrom(bob, carol, 0);
    }
    
    function testTransferFromToZeroAddress() public {
        nft.mint(alice);
        
        vm.prank(alice);
        vm.expectRevert("ERC721: transfer to the zero address");
        nft.transferFrom(alice, address(0), 0);
    }
    
    function testTransferFromClearsApproval() public {
        nft.mint(alice);
        
        vm.prank(alice);
        nft.approve(bob, 0);
        assertEq(nft.getApproved(0), bob);
        
        vm.prank(alice);
        nft.transferFrom(alice, carol, 0);
        assertEq(nft.getApproved(0), address(0));
    }
    
    function testSafeTransferFrom() public {
        nft.mint(alice);
        
        vm.prank(alice);
        nft.safeTransferFrom(alice, bob, 0);
        
        assertEq(nft.ownerOf(0), bob);
    }
    
    function testSafeTransferFromWithData() public {
        nft.mint(alice);
        
        vm.prank(alice);
        nft.safeTransferFrom(alice, bob, 0, "0x");
        
        assertEq(nft.ownerOf(0), bob);
    }
    
    function testSupportsInterface() public view {
        assertTrue(nft.supportsInterface(type(IERC721).interfaceId));
        assertTrue(nft.supportsInterface(type(IERC165).interfaceId));
        assertFalse(nft.supportsInterface(bytes4(0x12345678)));
    }
    
    function testTransferFromApproved() public {
        nft.mint(alice);
        
        vm.prank(alice);
        nft.approve(bob, 0);
        
        vm.prank(bob);
        nft.transferFrom(alice, carol, 0);
        
        assertEq(nft.ownerOf(0), carol);
    }
    
    function testTransferFromOperator() public {
        nft.mint(alice);
        
        vm.prank(alice);
        nft.setApprovalForAll(bob, true);
        
        vm.prank(bob);
        nft.transferFrom(alice, carol, 0);
        
        assertEq(nft.ownerOf(0), carol);
    }
} 