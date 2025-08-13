// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract RewardToken is ERC20, Ownable {
    address public stakingContract;

    constructor() ERC20("Reward Token", "RTK") {}

    function setStakingContract(address _stakingContract) external onlyOwner {
        stakingContract = _stakingContract;
    }

    function mint(address to, uint256 amount) external {
        require(msg.sender == stakingContract, "Only staking contract can mint");
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external {
        require(msg.sender == stakingContract, "Only staking contract can burn");
        _burn(from, amount);
    }
}

contract StakingContract is ReentrancyGuard {
    IERC20 public immutable stakingToken;
    RewardToken public immutable rewardToken;
    uint256 public immutable lockPeriod;

    struct StakeInfo {
        uint256 amount;
        uint256 unlockTime;
    }

    mapping(address => StakeInfo) private stakes;
    mapping(address => uint256) public totalStaked;

    event Staked(address indexed user, uint256 amount, uint256 unlockTime);
    event Unstaked(address indexed user, uint256 amount);

    constructor(address _stakingToken, uint256 _lockPeriod) {
        require(_stakingToken != address(0), "Invalid staking token");
        require(_lockPeriod > 0, "Lock period must be greater than 0");
        
        stakingToken = IERC20(_stakingToken);
        lockPeriod = _lockPeriod;
        
        rewardToken = new RewardToken();
        RewardToken(address(rewardToken)).setStakingContract(address(this));
    }

    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(stakingToken.balanceOf(msg.sender) >= amount, "Insufficient balance");
        require(stakingToken.allowance(msg.sender, address(this)) >= amount, "Insufficient allowance");

        require(stakingToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        StakeInfo storage userStake = stakes[msg.sender];
        userStake.amount += amount;
        userStake.unlockTime = block.timestamp + lockPeriod;
        totalStaked[msg.sender] += amount;

        rewardToken.mint(msg.sender, amount);

        emit Staked(msg.sender, amount, userStake.unlockTime);
    }

    function unstake(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        StakeInfo storage userStake = stakes[msg.sender];
        require(userStake.amount >= amount, "Insufficient staked amount");
        require(block.timestamp >= userStake.unlockTime, "Tokens still locked");
        require(rewardToken.balanceOf(msg.sender) >= amount, "Insufficient reward tokens");

        userStake.amount -= amount;
        totalStaked[msg.sender] -= amount;
        
        if (userStake.amount == 0) {
            userStake.unlockTime = 0;
        }

        rewardToken.burn(msg.sender, amount);
        require(stakingToken.transfer(msg.sender, amount), "Transfer failed");

        emit Unstaked(msg.sender, amount);
    }

    function getStakeInfo(address user) external view returns (uint256 amount, uint256 unlockTime) {
        StakeInfo memory userStake = stakes[user];
        return (userStake.amount, userStake.unlockTime);
    }

    function canUnstake(address user) external view returns (bool canUnstake) {
        StakeInfo memory userStake = stakes[user];
        return block.timestamp >= userStake.unlockTime && userStake.amount > 0;
    }

    function getTokenAddresses() external view returns (address stakingTokenAddr, address rewardTokenAddr) {
        return (address(stakingToken), address(rewardToken));
    }
}