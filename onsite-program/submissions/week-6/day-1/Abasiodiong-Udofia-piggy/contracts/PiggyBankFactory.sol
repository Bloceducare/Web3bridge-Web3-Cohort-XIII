// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./PiggyBank.sol";
import "./libraries/Errors.sol";

contract PiggyBankFactory {
    address public immutable admin;
    mapping(address => address[]) public userPiggyBanks;

    event PiggyBankCreated(address indexed user, address piggyBank, uint256 unlockTime, address asset);

    constructor() {
        admin = msg.sender;
    }

    function createPiggyBank(uint256 duration, address asset) external returns (address) {
        if (duration == 0) revert Errors.ZeroDuration();

        uint256 unlockTime = block.timestamp + duration;
        PiggyBank piggyBank = new PiggyBank(msg.sender, admin, unlockTime, asset);
        userPiggyBanks[msg.sender].push(address(piggyBank));

        emit PiggyBankCreated(msg.sender, address(piggyBank), unlockTime, asset);
        return address(piggyBank);
    }

    function getUserSavingsCount(address user) external view returns (uint256) {
        return userPiggyBanks[user].length;
    }

    struct PiggyBankInfo {
        address piggyBank;
        address asset;
        uint256 balance;
        uint256 unlockTime;
    }

    function getUserPiggyBanksInfo(address user) external view returns (PiggyBankInfo[] memory) {
        address[] memory pbs = userPiggyBanks[user];
        PiggyBankInfo[] memory infos = new PiggyBankInfo[](pbs.length);

        for (uint256 i = 0; i < pbs.length; i++) {
            PiggyBank pb = PiggyBank(pbs[i]);
            infos[i] = PiggyBankInfo({
                piggyBank: pbs[i],
                asset: pb.asset(),
                balance: pb.getBalance(),
                unlockTime: pb.unlockTime()
            });
        }

        return infos;
    }
}