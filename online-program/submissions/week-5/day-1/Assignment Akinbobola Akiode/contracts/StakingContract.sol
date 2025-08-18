// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Token1.Sol";
import "./Token2.sol";

contract StakingContract {
    Token1 public token1;
    Token2 public token2;
    uint256 public lockPeriod;
    
    struct Stake {
        uint256 amount;
        uint256 unlockTime;
    }
    
    mapping(address => Stake) public stakes;
    mapping(address => uint256) public pendingUnstakes;
    
    event Staked(address indexed user, uint256 amount, uint256 unlockTime);
    event UnstakeRequested(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    
    constructor(address _token1, address _token2, uint256 _lockPeriod) {
        token1 = Token1(_token1);
        token2 = Token2(_token2);
        lockPeriod = _lockPeriod;
    }
    
    function stake(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(token1.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        token2.mint(msg.sender, amount);
        
        if (stakes[msg.sender].amount > 0) {
            stakes[msg.sender].amount += amount;
        } else {
            stakes[msg.sender] = Stake(amount, block.timestamp + lockPeriod);
        }
        
        emit Staked(msg.sender, amount, stakes[msg.sender].unlockTime);
    }
    
    function unstake(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(stakes[msg.sender].amount >= amount, "Insufficient staked amount");
        require(token2.balanceOf(msg.sender) >= amount, "Insufficient Token 2 balance");
        
        token2.burn(msg.sender, amount);
        stakes[msg.sender].amount -= amount;
        
        if (block.timestamp >= stakes[msg.sender].unlockTime) {
            require(token1.transfer(msg.sender, amount), "Transfer failed");
            emit Unstaked(msg.sender, amount);
        } else {
            pendingUnstakes[msg.sender] += amount;
            emit UnstakeRequested(msg.sender, amount);
        }
    }
    
    function claimUnstaked() external {
        uint256 amount = pendingUnstakes[msg.sender];
        require(amount > 0, "No pending unstakes");
        require(block.timestamp >= stakes[msg.sender].unlockTime, "Lock period not expired");
        
        pendingUnstakes[msg.sender] = 0;
        require(token1.transfer(msg.sender, amount), "Transfer failed");
        emit Unstaked(msg.sender, amount);
    }
    
    function getStakeInfo(address user) external view returns (uint256 amount, uint256 unlockTime) {
        return (stakes[user].amount, stakes[user].unlockTime);
    }
    
    function getPendingUnstake(address user) external view returns (uint256) {
        return pendingUnstakes[user];
    }
    
    function canUnstake(address user) external view returns (bool) {
        return block.timestamp >= stakes[user].unlockTime;
    }
}