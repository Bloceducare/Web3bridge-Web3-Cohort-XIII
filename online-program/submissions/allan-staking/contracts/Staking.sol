// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./TokenAandB.sol";
import "./StakeLib.sol";

contract Staking {
    using StakeLib for uint256;

    TokenA public tokenA;
    TokenB public tokenB;
    uint256 public lockPeriod;

    struct StakeInfo {
        uint256 amount;
        uint256 unlockTime;
    }

    mapping(address => StakeInfo) public stakes;

    error InsufficientStake();
    error TokensLocked(uint256 unlockTime);

    constructor(address _tokenA, address _tokenB, uint256 _lockPeriod) {
        tokenA = TokenA(_tokenA);
        tokenB = TokenB(_tokenB);
        lockPeriod = _lockPeriod;
    }

    function stake(uint256 amount) external {
        require(amount > 0, "Zero stake");

        tokenA.transferFrom(msg.sender, address(this), amount);

        // Update stake info
        stakes[msg.sender].amount += amount;
        stakes[msg.sender].unlockTime = lockPeriod.getUnlockTime();

        // Mint 1:1 Token B
        tokenB.mint(msg.sender, amount);
    }

    function unstake(uint256 amount) external {
        StakeInfo storage info = stakes[msg.sender];

        if (info.amount < amount) revert InsufficientStake();
        if (block.timestamp < info.unlockTime) revert TokensLocked(info.unlockTime);

        // Update stake
        info.amount -= amount;

        // Burn Token B
        tokenB.burn(msg.sender, amount);

        // Return Token A
        tokenA.transfer(msg.sender, amount);
    }

    function getStakeInfo(address user) external view returns (uint256, uint256) {
        StakeInfo memory info = stakes[user];
        return (info.amount, info.unlockTime);
    }
}
