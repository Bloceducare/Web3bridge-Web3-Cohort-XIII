// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/RolesRegistry.sol";

contract RolesRegistryTest is Test {
    RolesRegistry public rolesRegistry;
    
    address public alice = address(0x1);
    address public bob = address(0x2);
    address public carol = address(0x3);
    
    uint256 public tokenId1 = 1;
    uint256 public tokenId2 = 2;
    
    bytes32 public constant ROLE1 = keccak256("ROLE1");
    bytes32 public constant ROLE2 = keccak256("ROLE2");
    
    function setUp() public {
        rolesRegistry = new RolesRegistry();
        
        rolesRegistry.grantRole(rolesRegistry.DEFAULT_ADMIN_ROLE(), alice, tokenId1);
        rolesRegistry.grantRole(rolesRegistry.DEFAULT_ADMIN_ROLE(), alice, tokenId2);
    }
    
    function testHasRole() public view {
        assertFalse(rolesRegistry.hasRole(ROLE1, alice, tokenId1));
    }
    
    function testGrantRole() public {
        rolesRegistry.grantRole(ROLE1, alice, tokenId1);
        assertTrue(rolesRegistry.hasRole(ROLE1, alice, tokenId1));
    }
    
    function testGrantRoleAlreadyGranted() public {
        rolesRegistry.grantRole(ROLE1, alice, tokenId1);
        rolesRegistry.grantRole(ROLE1, alice, tokenId1);
        assertTrue(rolesRegistry.hasRole(ROLE1, alice, tokenId1));
    }
    
    function testGrantRoleNotAdmin() public {
        vm.prank(bob);
        vm.expectRevert("AccessControl: sender is not admin");
        rolesRegistry.grantRole(ROLE1, alice, tokenId1);
    }
    
    function testRevokeRole() public {
        rolesRegistry.grantRole(ROLE1, alice, tokenId1);
        rolesRegistry.revokeRole(ROLE1, alice, tokenId1);
        assertFalse(rolesRegistry.hasRole(ROLE1, alice, tokenId1));
    }
    
    function testRevokeRoleNotGranted() public {
        rolesRegistry.revokeRole(ROLE1, alice, tokenId1);
        assertFalse(rolesRegistry.hasRole(ROLE1, alice, tokenId1));
    }
    
    function testRevokeRoleNotAdmin() public {
        rolesRegistry.grantRole(ROLE1, alice, tokenId1);
        vm.prank(bob);
        vm.expectRevert("AccessControl: sender is not admin");
        rolesRegistry.revokeRole(ROLE1, alice, tokenId1);
    }
    
    function testRenounceRole() public {
        rolesRegistry.grantRole(ROLE1, alice, tokenId1);
        vm.prank(alice);
        rolesRegistry.renounceRole(ROLE1, tokenId1);
        assertFalse(rolesRegistry.hasRole(ROLE1, alice, tokenId1));
    }
    
    function testGetRoleMemberCount() public {
        assertEq(rolesRegistry.getRoleMemberCount(ROLE1, tokenId1), 0);
        
        rolesRegistry.grantRole(ROLE1, alice, tokenId1);
        assertEq(rolesRegistry.getRoleMemberCount(ROLE1, tokenId1), 1);
        
        rolesRegistry.grantRole(ROLE1, bob, tokenId1);
        assertEq(rolesRegistry.getRoleMemberCount(ROLE1, tokenId1), 2);
    }
    
    function testGetRoleMember() public {
        rolesRegistry.grantRole(ROLE1, alice, tokenId1);
        rolesRegistry.grantRole(ROLE1, bob, tokenId1);
        
        assertEq(rolesRegistry.getRoleMember(ROLE1, tokenId1, 0), alice);
        assertEq(rolesRegistry.getRoleMember(ROLE1, tokenId1, 1), bob);
    }
    
    function testGetRoleMemberIndexOutOfBounds() public {
        vm.expectRevert("Index out of bounds");
        rolesRegistry.getRoleMember(ROLE1, tokenId1, 0);
    }
    
    function testGetRoleAdmin() public view {
        assertEq(rolesRegistry.getRoleAdmin(ROLE1), bytes32(0));
    }
    
    function testSupportsInterface() public view {
        assertTrue(rolesRegistry.supportsInterface(type(IERC7432).interfaceId));
        assertTrue(rolesRegistry.supportsInterface(type(IERC165).interfaceId));
        assertFalse(rolesRegistry.supportsInterface(bytes4(0x12345678)));
    }
    
    function testMultipleTokens() public {
        rolesRegistry.grantRole(ROLE1, alice, tokenId1);
        rolesRegistry.grantRole(ROLE1, alice, tokenId2);
        
        assertTrue(rolesRegistry.hasRole(ROLE1, alice, tokenId1));
        assertTrue(rolesRegistry.hasRole(ROLE1, alice, tokenId2));
        
        rolesRegistry.revokeRole(ROLE1, alice, tokenId1);
        assertFalse(rolesRegistry.hasRole(ROLE1, alice, tokenId1));
        assertTrue(rolesRegistry.hasRole(ROLE1, alice, tokenId2));
    }
    
    function testRoleRemovalOrder() public {
        rolesRegistry.grantRole(ROLE1, alice, tokenId1);
        rolesRegistry.grantRole(ROLE1, bob, tokenId1);
        rolesRegistry.grantRole(ROLE1, carol, tokenId1);
        
        assertEq(rolesRegistry.getRoleMemberCount(ROLE1, tokenId1), 3);
        
        rolesRegistry.revokeRole(ROLE1, bob, tokenId1);
        assertEq(rolesRegistry.getRoleMemberCount(ROLE1, tokenId1), 2);
        assertTrue(rolesRegistry.hasRole(ROLE1, alice, tokenId1));
        assertFalse(rolesRegistry.hasRole(ROLE1, bob, tokenId1));
        assertTrue(rolesRegistry.hasRole(ROLE1, carol, tokenId1));
    }
} 