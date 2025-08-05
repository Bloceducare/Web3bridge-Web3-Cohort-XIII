// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ITokenA {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function mint(address to, uint256 amount) external returns (bool);
    function setStakingContract(address _stakingContract)
        external
        returns (bool);
}

interface ITokenB {
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
    function setStakingContract(address _stakingContract)
        external
        returns (bool);
}

contract StakingContract {
    ITokenA public tokenA;
    ITokenB public tokenB;
    uint256 public lockPeriod;

    struct StakeInfo {
        uint256 amount;
        uint256 unlockTime;
    }

    mapping(address => StakeInfo) public stakes;

    event Staked(address indexed user, uint256 amount, uint256 unlockTime);
    event Unstaked(address indexed user, uint256 amount);

    constructor(
        address _tokenA,
        address _tokenB,
        uint256 _lockPeriod
    ) {
        tokenA = ITokenA(_tokenA);
        tokenB = ITokenB(_tokenB);
        lockPeriod = _lockPeriod;
    }

    function _setStakingContract() public {
        tokenA.setStakingContract(address(this));
        tokenB.setStakingContract(address(this));
    }

    function stake(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");

        // Transfer Token A from user to contract
        require(tokenA.transfer(address(this), amount), "Transfer failed");

        // Update stake info
        stakes[msg.sender].amount += amount;
        stakes[msg.sender].unlockTime = block.timestamp + lockPeriod;

        // Mint Token B to user (1:1 ratio)
        tokenB.mint(msg.sender, amount);

        emit Staked(msg.sender, amount, stakes[msg.sender].unlockTime);
    }

    function unstake(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(
            stakes[msg.sender].amount >= amount,
            "Insufficient staked amount"
        );
        require(
            block.timestamp >= stakes[msg.sender].unlockTime,
            "Tokens still locked"
        );

        // Update stake info
        stakes[msg.sender].amount -= amount;

        // If fully unstaking, reset unlock time
        if (stakes[msg.sender].amount == 0) {
            stakes[msg.sender].unlockTime = 0;
        }

        // Burn Token B from user
        tokenB.burn(msg.sender, amount);

        // Return Token A to user
        require(tokenA.transfer(msg.sender, amount), "Transfer failed");

        emit Unstaked(msg.sender, amount);
    }

    function getStakeInfo(address user)
        external
        view
        returns (uint256 amount, uint256 unlockTime)
    {
        return (stakes[user].amount, stakes[user].unlockTime);
    }

    function isUnlocked(address user) external view returns (bool) {
        return block.timestamp >= stakes[user].unlockTime;
    }

    function timeUntilUnlock(address user) external view returns (uint256) {
        if (block.timestamp >= stakes[user].unlockTime) {
            return 0;
        }
        return stakes[user].unlockTime - block.timestamp;
    }

    function mintTokenA(address to, uint256 amount) external {
        tokenA.mint(to, amount);
    }
}
