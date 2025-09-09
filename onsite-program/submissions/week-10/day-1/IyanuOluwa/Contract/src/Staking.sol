// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
A simple ERC20 staking contract with:
- Per-position stakes and unlock times
- Global reward distribution using rewardPerToken accumulator
- Reward rate is tokens per second (reward token can be same as staking token)
- Withdraw after unlock; emergencyWithdraw forfeits rewards
- Read helpers for UI: user positions, pending rewards, unlock time, totals, APR

Notes:
- Fund the contract with reward tokens before distributing (fundRewards).
- APR is derived as (rewardRate * 365 days) / totalStaked, returned in basis points (bps), i.e. 10000 = 100%.
*/

interface IERC20 {
  function transfer(address to, uint256 amount) external returns (bool);
  function transferFrom(address from, address to, uint256 amount) external returns (bool);
  function balanceOf(address account) external view returns (uint256);
  function allowance(address owner, address spender) external view returns (uint256);
}

contract Staking {
  struct Position {
    address owner;
    uint256 amount;
    uint256 rewardPerTokenPaid; // checkpoint at last update for this position
    uint256 rewardsAccrued;     // stored rewards not yet claimed
    uint64 start;
    uint64 unlockTime;
  }

  // Tokens
  IERC20 public immutable STAKING_TOKEN;
  IERC20 public immutable REWARD_TOKEN;

  // Staking/rewards config
  uint256 public rewardRate;          // tokens per second distributed to stakers
  uint256 public lockDuration;        // default lock duration for positions in seconds

  // Global accounting
  uint256 public totalStaked;
  uint256 public lastUpdateTime;
  uint256 public rewardPerTokenStored; // scaled by 1e18 for precision

  // Positions
  uint256 public nextPositionId = 1;
  mapping(uint256 => Position) public positions;
  mapping(address => uint256[]) public userPositionIds;

  // Admin
  address public owner;

  // Events
  event Staked(address indexed user, uint256 indexed positionId, uint256 amount, uint256 unlockTime);
  event Withdrawn(address indexed user, uint256 indexed positionId, uint256 amount);
  event RewardsClaimed(address indexed user, uint256 indexed positionId, uint256 amount);
  event EmergencyWithdrawn(address indexed user, uint256 indexed positionId, uint256 amount);
  event RewardRateUpdated(uint256 newRate);
  event RewardsFunded(uint256 amount);
  event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

  modifier onlyOwner() {
    require(msg.sender == owner, "Not owner");
    _;
  }

  modifier updateRewardGlobal() {
    _updateRewardGlobal();
    _;
  }

  constructor(
    address _stakingToken,
    address _rewardToken,
    uint256 _rewardRatePerSecond,
    uint256 _lockDurationSeconds
  ) {
    require(_stakingToken != address(0) && _rewardToken != address(0), "Zero address");
    STAKING_TOKEN = IERC20(_stakingToken);
    REWARD_TOKEN = IERC20(_rewardToken);
    rewardRate = _rewardRatePerSecond;
    lockDuration = _lockDurationSeconds;
    owner = msg.sender;
    lastUpdateTime = block.timestamp;
  }

  // Internal global reward update
  function _updateRewardGlobal() internal {
    if (block.timestamp == lastUpdateTime) return;
    if (totalStaked > 0 && rewardRate > 0) {
      uint256 delta = block.timestamp - lastUpdateTime;
      // rewardPerToken += (rewardRate * delta) / totalStaked, scaled by 1e18
      rewardPerTokenStored += (rewardRate * delta * 1e18) / totalStaked;
    }
    lastUpdateTime = block.timestamp;
  }

  // Internal per-position reward accounting
  function _updatePositionRewards(uint256 positionId) internal {
    Position storage p = positions[positionId];
    if (p.amount == 0) {
      p.rewardPerTokenPaid = rewardPerTokenStored;
      return;
    }
    uint256 accrued = (p.amount * (rewardPerTokenStored - p.rewardPerTokenPaid)) / 1e18;
    if (accrued > 0) {
      p.rewardsAccrued += accrued;
    }
    p.rewardPerTokenPaid = rewardPerTokenStored;
  }

  // Stake tokens, creating a new position with default lock duration
  function stake(uint256 amount) external updateRewardGlobal {
    require(amount > 0, "Amount=0");
    require(STAKING_TOKEN.transferFrom(msg.sender, address(this), amount), "transferFrom failed");

    uint256 pid = nextPositionId++;
    Position storage p = positions[pid];
    p.owner = msg.sender;
    p.amount = amount;
    p.rewardPerTokenPaid = rewardPerTokenStored;
    p.rewardsAccrued = 0;
    p.start = uint64(block.timestamp);
    p.unlockTime = uint64(block.timestamp + lockDuration);

    userPositionIds[msg.sender].push(pid);
    totalStaked += amount;

    emit Staked(msg.sender, pid, amount, p.unlockTime);
  }

  // Withdraw principal from a matured position; rewards remain to be claimed
  function withdraw(uint256 positionId) external updateRewardGlobal {
    Position storage p = positions[positionId];
    require(p.owner == msg.sender, "Not position owner");
    require(p.amount > 0, "Nothing staked");
    require(block.timestamp >= p.unlockTime, "Position locked");

    _updatePositionRewards(positionId);

    uint256 amount = p.amount;
    p.amount = 0; // zero the position amount
    totalStaked -= amount;

    require(STAKING_TOKEN.transfer(msg.sender, amount), "transfer failed");
    emit Withdrawn(msg.sender, positionId, amount);
  }

  // Claim all rewards from a position
  function claimRewards(uint256 positionId) external updateRewardGlobal {
    Position storage p = positions[positionId];
    require(p.owner == msg.sender, "Not position owner");
    _updatePositionRewards(positionId);

    uint256 reward = p.rewardsAccrued;
    require(reward > 0, "No rewards");
    p.rewardsAccrued = 0;

    require(REWARD_TOKEN.transfer(msg.sender, reward), "reward transfer failed");
    emit RewardsClaimed(msg.sender, positionId, reward);
  }

  // Emergency withdraw: withdraw principal before unlock, forfeiting all rewards
  function emergencyWithdraw(uint256 positionId) external updateRewardGlobal {
    Position storage p = positions[positionId];
    require(p.owner == msg.sender, "Not position owner");
    require(p.amount > 0, "Nothing staked");

    // Forfeit rewards
    p.rewardsAccrued = 0;
    p.rewardPerTokenPaid = rewardPerTokenStored;

    uint256 amount = p.amount;
    p.amount = 0;
    totalStaked -= amount;

    require(STAKING_TOKEN.transfer(msg.sender, amount), "transfer failed");
    emit EmergencyWithdrawn(msg.sender, positionId, amount);
  }

  // ------------ Views / Read helpers ------------

  // Return all position IDs owned by a user
  function getUserPositionIds(address user) external view returns (uint256[] memory) {
    return userPositionIds[user];
  }

  // Return a position core data
  function getPosition(uint256 positionId) external view returns (
    address owner_,
    uint256 amount,
    uint64 start,
    uint64 unlockTime
  ) {
    Position storage p = positions[positionId];
    owner_ = p.owner;
    amount = p.amount;
    start = p.start;
    unlockTime = p.unlockTime;
  }

  // Return pending rewards for a position, including not-yet-updated global accumulator
  function pendingRewards(uint256 positionId) public view returns (uint256) {
    Position storage p = positions[positionId];
    uint256 rpt = rewardPerTokenStored;
    if (block.timestamp > lastUpdateTime && totalStaked > 0 && rewardRate > 0) {
      uint256 delta = block.timestamp - lastUpdateTime;
      rpt += (rewardRate * delta * 1e18) / totalStaked;
    }
    uint256 accrued = 0;
    if (p.amount > 0) {
      accrued = (p.amount * (rpt - p.rewardPerTokenPaid)) / 1e18;
    }
    return p.rewardsAccrued + accrued;
  }

  // Helper: unlock time for position
  function unlockTimeOf(uint256 positionId) external view returns (uint64) {
    return positions[positionId].unlockTime;
  }

  // Protocol-wide APR in basis points (10000 = 100%)
  // APR ~= reward distributed in a year / totalStaked
  function protocolAprBps() external view returns (uint256) {
    if (totalStaked == 0 || rewardRate == 0) return 0;
    uint256 yearly = rewardRate * 365 days;
    return (yearly * 10000) / totalStaked;
  }

  // ------------ Admin functions ------------

  function setRewardRate(uint256 newRate) external onlyOwner updateRewardGlobal {
    rewardRate = newRate;
    emit RewardRateUpdated(newRate);
  }

  function setLockDuration(uint256 newLockDuration) external onlyOwner {
    require(newLockDuration > 0, "lock=0");
    lockDuration = newLockDuration;
  }

  // Fund reward token to the contract
  function fundRewards(uint256 amount) external {
    require(amount > 0, "amount=0");
    require(REWARD_TOKEN.transferFrom(msg.sender, address(this), amount), "transferFrom failed");
    emit RewardsFunded(amount);
  }

  function transferOwnership(address newOwner) external onlyOwner {
    require(newOwner != address(0), "zero addr");
    emit OwnershipTransferred(owner, newOwner);
    owner = newOwner;
  }
}