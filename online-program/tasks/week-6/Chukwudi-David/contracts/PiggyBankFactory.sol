// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

contract PiggyBankFactory is Ownable {
    using Address for address payable;

    uint256 public constant BREAKING_FEE_BPS = 300; // 3%
    uint256 public constant BPS_DENOMINATOR = 10_000;

    mapping(address => address[]) private _userPiggyBanks;

    struct PiggyInfo {
        address owner;
        uint256 lockPeriod;
        uint256 createdAt;
    }

    mapping(address => PiggyInfo) public piggyInfo;

    event PiggyBankCreated(address indexed piggy, address indexed owner, uint256 lockPeriod);

    function createPiggyBank(address owner, uint256 lockPeriodSeconds) external returns (address) {
        require(owner != address(0), "owner zero");
        require(lockPeriodSeconds > 0, "lockPeriod must be > 0");

        PiggyBank child = new PiggyBank(owner, lockPeriodSeconds, address(this));
        address childAddr = address(child);

        _userPiggyBanks[owner].push(childAddr);
        piggyInfo[childAddr] = PiggyInfo({owner: owner, lockPeriod: lockPeriodSeconds, createdAt: block.timestamp});

        emit PiggyBankCreated(childAddr, owner, lockPeriodSeconds);

        return childAddr;
    }

    function getPiggyBanks(address account) external view returns (address[] memory) {
        return _userPiggyBanks[account];
    }

    function getPiggyBankCount(address account) external view returns (uint256) {
        return _userPiggyBanks[account].length;
    }

    function totalBalanceOf(address account, address token) external view returns (uint256 total) {
        address[] memory arr = _userPiggyBanks[account];
        for (uint256 i = 0; i < arr.length; i++) {
            total += PiggyBank(arr[i]).balanceOf(token);
        }
    }

    receive() external payable {}
}
