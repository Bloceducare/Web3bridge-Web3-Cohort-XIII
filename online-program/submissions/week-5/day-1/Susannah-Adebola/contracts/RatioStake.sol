// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ITokenB is IERC20 {
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
}

contract RatioStake {
    struct Stake {
        uint256 amount;
        uint256 unlockTime;
    }

    mapping(address => Stake) public stakes;

    IERC20 public tokenA;
    ITokenB public tokenB;
    uint256 public immutable lockPeriod;

    event Staked(address indexed user, uint256 amount, uint256 unlockTime);
    event Unstaked(address indexed user, uint256 amount);

    constructor(IERC20 _tokenA, ITokenB _tokenB, uint256 _lockPeriod) {
        require(_lockPeriod > 0, "Lock period must be > 0");
        tokenA = _tokenA;
        tokenB = _tokenB;
        lockPeriod = _lockPeriod;
    }

    function stake(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        require(tokenA.allowance(msg.sender, address(this)) >= amount, "Token A allowance too low");

        tokenA.transferFrom(msg.sender, address(this), amount);
        stakes[msg.sender].amount += amount;
        stakes[msg.sender].unlockTime = block.timestamp + lockPeriod;

        tokenB.mint(msg.sender, amount);

        emit Staked(msg.sender, amount, stakes[msg.sender].unlockTime);
    }

    function unstake(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        require(stakes[msg.sender].amount >= amount, "Insufficient staked amount");
        require(block.timestamp >= stakes[msg.sender].unlockTime, "Tokens still locked");

        tokenB.burn(msg.sender, amount);
        tokenA.transfer(msg.sender, amount);

        stakes[msg.sender].amount -= amount;

        emit Unstaked(msg.sender, amount);
    }

    function getStakeInfo(address user) external view returns (uint256, uint256) {
        return (stakes[user].amount, stakes[user].unlockTime);
    }
}
