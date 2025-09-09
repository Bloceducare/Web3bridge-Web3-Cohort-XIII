// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {Staking} from "../src/Staking.sol";

contract MockToken is ERC20 {
    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {}
    function mint(address to, uint256 amount) external { _mint(to, amount); }
}

contract StakingTest is Test {
    MockToken stakeToken;
    MockToken rewardToken;
    Staking staking;

    address alice = address(0xA11CE);
    address bob = address(0xB0B);

    uint256 constant INITIAL_SUPPLY = 1_000_000 ether;
    uint256 constant FUND_REWARDS = 200_000 ether;
    uint256 constant REWARD_RATE = 1 ether;
    uint256 constant LOCK_DURATION = 7 days;

    function setUp() public {
        stakeToken = new MockToken("StakeToken", "STK");
        rewardToken = new MockToken("RewardToken", "RWD");

        stakeToken.mint(address(this), INITIAL_SUPPLY);
        rewardToken.mint(address(this), INITIAL_SUPPLY);

        staking = new Staking(address(stakeToken), address(rewardToken), REWARD_RATE, LOCK_DURATION);

        require(rewardToken.approve(address(staking), FUND_REWARDS), "approve failed");
        staking.fundRewards(FUND_REWARDS);

        require(stakeToken.transfer(alice, 10_000 ether), "transfer to alice failed");
        require(stakeToken.transfer(bob, 5_000 ether), "transfer to bob failed");

        vm.label(address(stakeToken), "STK");
        vm.label(address(rewardToken), "RWD");
        vm.label(address(staking), "Staking");
        vm.label(alice, "Alice");
        vm.label(bob, "Bob");
    }

    function _stake(address user, uint256 amount) internal returns (uint256 pid) {
        vm.startPrank(user);
        require(stakeToken.approve(address(staking), amount), "approve failed");
        staking.stake(amount);
        vm.stopPrank();
        uint256[] memory ids = staking.getUserPositionIds(user);
        pid = ids[ids.length - 1];
    }

    function test_StakeAndPendingRewardsAccrual() public {
        uint256 pid = _stake(alice, 1_000 ether);
        vm.warp(block.timestamp + 1 hours);
        uint256 pending = staking.pendingRewards(pid);
        assertApproxEqRel(pending, 3600 ether, 1e15);
    }

    function test_ClaimRewards() public {
        uint256 pid = _stake(alice, 2_000 ether);
        vm.warp(block.timestamp + 2 hours);
        uint256 beforeBal = rewardToken.balanceOf(alice);
        vm.prank(alice);
        staking.claimRewards(pid);
        uint256 claimed = rewardToken.balanceOf(alice) - beforeBal;
        assertApproxEqRel(claimed, 7200 ether, 1e15);
    }

    function test_WithdrawAfterUnlock() public {
        uint256 amount = 1_500 ether;
        uint256 pid = _stake(alice, amount);
        vm.warp(block.timestamp + LOCK_DURATION + 1);
        uint256 beforeBal = stakeToken.balanceOf(alice);
        vm.prank(alice);
        staking.withdraw(pid);
        assertEq(stakeToken.balanceOf(alice) - beforeBal, amount);
        (, uint256 posAmt, , ) = staking.getPosition(pid);
        assertEq(posAmt, 0);
    }

    function test_EmergencyWithdrawBeforeUnlock_ForfeitsRewards() public {
        uint256 pid = _stake(alice, 800 ether);
        vm.warp(block.timestamp + 1 days);
        uint256 pendingBefore = staking.pendingRewards(pid);
        assertGt(pendingBefore, 0);
        uint256 beforeBal = stakeToken.balanceOf(alice);
        vm.prank(alice);
        staking.emergencyWithdraw(pid);
        assertEq(stakeToken.balanceOf(alice) - beforeBal, 800 ether);
        vm.expectRevert();
        vm.prank(alice);
        staking.claimRewards(pid);
    }

    function test_ReadHelpers_PositionsAndAPR() public {
        uint256 pid1 = _stake(alice, 1_000 ether);
        uint256 pid2 = _stake(alice, 500 ether);
        uint256[] memory ids = staking.getUserPositionIds(alice);
        assertEq(ids.length, 2);
        assertEq(ids[0], pid1);
        assertEq(ids[1], pid2);
        (address owner1, uint256 amt1, uint64 start1, uint64 unlock1) = staking.getPosition(pid1);
        assertEq(owner1, alice);
        assertEq(amt1, 1_000 ether);
        assertEq(unlock1, start1 + uint64(LOCK_DURATION));
        uint256 aprBps = staking.protocolAprBps();
        uint256 expectedApr = (REWARD_RATE * 365 days * 10000) / (1_500 ether);
        assertApproxEqRel(aprBps, expectedApr, 1e15);
    }
}