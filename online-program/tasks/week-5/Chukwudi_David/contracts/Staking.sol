// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract Staking {

    ERC20Burnable public tokenB;
    uint256 public lockPeriod;

    struct StakeDetails {
        address tokenA;
        uint256 amount;
        uint256 unlockTime;
    }

    mapping(address => mapping(address => StakeDetails)) public stakes;

    event Staked(address indexed user, uint256 amount, uint256 unlockTime);
    event Unstaked(address indexed user, uint256 amount);

    constructor(address _tokenB, uint256 _lockPeriod) {
        tokenB = ERC20Burnable(_tokenB);
        lockPeriod = _lockPeriod;
    }

    function stake(address _staker, address _tokenA, uint256 amount) external {
        require(amount > 0, "Amount must be > 0");

        require(IERC20(_tokenA).transferFrom(msg.sender, address(this), amount), "Transfer failed");


        require(tokenB.mint(msg.sender, amount), "Reward mint failed");

        stakes[_staker][_tokenA] = StakeDetails({
            tokenA: _tokenA,
            amount: stakes[_staker][_tokenA].amount + amount,
            unlockTime: block.timestamp + lockPeriod
        });

        emit Staked(msg.sender, amount, stakes[_staker][_tokenA].unlockTime);
    }

    function unstake(address _staker, address _tokenA, uint256 amount) external {
        StakeDetails storage details = stakes[_staker][_tokenA];
        require(details.amount >= amount, "Not enough staked");
        require(block.timestamp >= details.unlockTime, "Still locked");

        tokenB.burnFrom(msg.sender, amount);

        details.amount -= amount;

        require(IERC20(_tokenA).transfer(msg.sender, amount), "Unstake failed");

        emit Unstaked(msg.sender, amount);
    }

    function getStakeDetails(address staker, address _tokenA) external view returns (address tokenA, uint256 amount, uint256 unlockTime) {
        StakeDetails memory details = stakes[staker][_tokenA];
        return (details.tokenA, details.amount, details.unlockTime);
    }
}
