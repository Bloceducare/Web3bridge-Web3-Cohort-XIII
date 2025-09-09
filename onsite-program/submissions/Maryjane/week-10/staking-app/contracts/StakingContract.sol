// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract StakingContract {
    struct Stake {
        uint256 id;
        uint256 amount;
        uint256 startTime;
        uint256 endTime;
        uint256 rewardDebt;
    }

    mapping(address => Stake[]) public userStakes;
    mapping(address => uint256) public pendingRewards;
    mapping(uint256 => address) public stakeOwners;
    mapping(uint256 => bool) public stakeExists;

    uint256 public totalStaked;
    uint256 public rewardRate = 10; // 10% annual reward rate (basis points)
    uint256 public apr = 1000; // 10% APR in basis points
    uint256 public constant SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
    uint256 public constant MIN_STAKE_AMOUNT = 0.001 ether; // Minimum stake: 0.001 ETH
    uint256 private stakeCounter;

    address public owner;

    event Staked(address indexed user, uint256 amount, uint256 stakeId);
    event Withdrawn(address indexed user, uint256 amount, uint256 stakeId);
    event RewardsClaimed(address indexed user, uint256 amount, uint256 stakeId);
    event EmergencyWithdrawn(address indexed user, uint256 amount, uint256 stakeId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function stake(uint256 amount) external payable {
        // require(amount >= MIN_STAKE_AMOUNT, "Minimum stake amount is 0.001 ETH");
        // require(msg.value == amount, "Sent value must match amount");

        stakeCounter++;
        uint256 stakeId = stakeCounter;

        Stake memory newStake = Stake({
            id: stakeId,
            amount: amount,
            startTime: block.timestamp,
            endTime: block.timestamp + SECONDS_PER_YEAR,
            rewardDebt: 0
        });

        userStakes[msg.sender].push(newStake);
        stakeOwners[stakeId] = msg.sender;
        stakeExists[stakeId] = true;
        totalStaked += amount;

        emit Staked(msg.sender, amount, stakeId);
    }

    function withdraw(uint256 stakeId) external {
        require(stakeExists[stakeId], "Stake does not exist");
        require(stakeOwners[stakeId] == msg.sender, "Not the owner of this stake");

        Stake storage userStake = _getStakeById(msg.sender, stakeId);
        require(block.timestamp >= userStake.endTime, "Stake is still locked");

        uint256 amount = userStake.amount;
        uint256 rewards = _calculateRewards(userStake);

        // Mark stake as withdrawn
        userStake.amount = 0;
        stakeExists[stakeId] = false;
        totalStaked -= amount;

        // Transfer tokens back to user
        payable(msg.sender).transfer(amount + rewards);

        emit Withdrawn(msg.sender, amount, stakeId);
    }

    function claimRewards(uint256 stakeId) external {
        require(stakeExists[stakeId], "Stake does not exist");
        require(stakeOwners[stakeId] == msg.sender, "Not the owner of this stake");

        Stake storage userStake = _getStakeById(msg.sender, stakeId);
        uint256 rewards = _calculateRewards(userStake);

        require(rewards > 0, "No rewards available");

        // Update reward debt
        userStake.rewardDebt += rewards;

        // Transfer rewards
        payable(msg.sender).transfer(rewards);

        emit RewardsClaimed(msg.sender, rewards, stakeId);
    }

    function emergencyWithdraw(uint256 stakeId) external {
        require(stakeExists[stakeId], "Stake does not exist");
        require(stakeOwners[stakeId] == msg.sender, "Not the owner of this stake");

        Stake storage userStake = _getStakeById(msg.sender, stakeId);
        uint256 amount = userStake.amount;

        require(amount > 0, "No amount to withdraw");

        // Calculate penalty (10% of staked amount)
        uint256 penalty = amount / 10;
        uint256 withdrawAmount = amount - penalty;

        // Mark stake as withdrawn
        userStake.amount = 0;
        stakeExists[stakeId] = false;
        totalStaked -= amount;

        // Transfer amount minus penalty
        payable(msg.sender).transfer(withdrawAmount);

        emit EmergencyWithdrawn(msg.sender, withdrawAmount, stakeId);
    }

    function getUserStakes(address user) external view returns (Stake[] memory) {
        return userStakes[user];
    }

    function _getStakeById(address user, uint256 stakeId) internal view returns (Stake storage) {
        Stake[] storage stakes = userStakes[user];
        for (uint256 i = 0; i < stakes.length; i++) {
            if (stakes[i].id == stakeId) {
                return stakes[i];
            }
        }
        revert("Stake not found");
    }

    function _calculateRewards(Stake memory userStake) internal view returns (uint256) {
        if (block.timestamp < userStake.startTime) return 0;

        uint256 stakingDuration = block.timestamp - userStake.startTime;
        uint256 annualRewards = (userStake.amount * rewardRate) / 10000; // rewardRate is in basis points
        uint256 rewards = (annualRewards * stakingDuration) / SECONDS_PER_YEAR;

        return rewards - userStake.rewardDebt;
    }

    // Function to receive Ether
    receive() external payable {}
}