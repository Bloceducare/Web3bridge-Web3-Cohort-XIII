// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console2} from "forge-std/Test.sol";
import {LootBox} from "../src/LootBox.sol";
import {TestERC20} from "../src/TestERC20.sol";
import {TestERC721} from "../src/TestERC721.sol";
import {TestERC1155} from "../src/TestERC1155.sol";

contract LootBoxTest is Test {
    LootBox lb;
    TestERC20 t20;
    TestERC721 t721;
    TestERC1155 t1155;
    MockVRFCoordinator mockVRF;

    function setUp() public {
        mockVRF = new MockVRFCoordinator();
        
        lb = new LootBox(
            address(mockVRF),
            0,
            bytes32(0)
        );

        t20 = new TestERC20("T20", "T2", 18);
        t721 = new TestERC721("T721", "T7");
        t1155 = new TestERC1155();

        t20.mint(address(lb), 1_000 ether);
        t721.safeMint(address(lb), 1);
        t721.safeMint(address(lb), 2);
        t1155.mint(address(lb), 1, 100);

        lb.addERC20Reward(address(t20), 10 ether, 5, 40);
        lb.addERC721Reward(address(t721), 1, 30);
        lb.addERC721Reward(address(t721), 2, 20);
        lb.addERC1155Reward(address(t1155), 1, 5, 3, 10);
    }

    function test_AddRewards() public view {
        assertEq(lb.getRewardsCount(), 4);
        assertEq(lb.totalActiveWeight(), 100);
    }

    function test_OpenBox_RequestsVRF() public {
        vm.deal(address(this), 1 ether);
        lb.openBox{value: 0.01 ether}();
        
        uint256 pendingRequest = lb.getPendingRequest(address(this));
        assertGt(pendingRequest, 0);
    }

    function test_Revert_NoRewards() public {
        LootBox emptyLb = new LootBox(
            address(mockVRF),
            0,
            bytes32(0)
        );
        
        vm.deal(address(this), 1 ether);
        vm.expectRevert(LootBox.NoRewardsAvailable.selector);
        emptyLb.openBox{value: 0.01 ether}();
    }

    function test_Revert_WrongFee() public {
        vm.deal(address(this), 1 ether);
        vm.expectRevert(LootBox.InsufficientFee.selector);
        lb.openBox{value: 0.02 ether}();
    }

    function test_WeightedDistribution_Smoke() public {
        vm.deal(address(this), 1 ether);
        lb.openBox{value: 0.01 ether}();
        
        uint256 requestId = lb.getPendingRequest(address(this));
        assertGt(requestId, 0);
        assertEq(lb.totalActiveWeight(), 100);
    }
}

contract MockVRFCoordinator {
    mapping(uint256 => address) public pendingRequests;
    uint256 public requestIdCounter = 1;
    
    function requestRandomWords(
        bytes32,
        uint64,
        uint16,
        uint32,
        uint32
    ) external returns (uint256 requestId) {
        requestId = requestIdCounter++;
        pendingRequests[requestId] = msg.sender;
        return requestId;
    }
    
    function getPendingRequest(uint256 requestId) external view returns (address) {
        return pendingRequests[requestId];
    }
    
    function clearRequest(uint256 requestId) external {
        delete pendingRequests[requestId];
    }
}