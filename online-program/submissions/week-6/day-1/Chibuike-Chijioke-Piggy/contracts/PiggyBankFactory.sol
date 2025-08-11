// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./errors/PiggyErrors.sol";
import "./PiggyBankSaving.sol";

contract PiggyBankFactory {
    address public immutable piggyAdmin;

    struct PiggyVaultInfo {
        address vaultAddress;
        uint256 lockEnd;
        bool isERC20;
        address tokenAddress;
        uint256 createdAt;
    }

    mapping(address => PiggyVaultInfo[]) public userVaults;

    event VaultCreated(address indexed user, address vault, uint256 lockEnd);

    constructor() {
        piggyAdmin = msg.sender;
    }

    function createPiggyVault(uint256 lockDuration, bool isERC20, address tokenAddress) external {
        PiggyBankSaving vault = new PiggyBankSaving(msg.sender, lockDuration, isERC20, tokenAddress, piggyAdmin);

        PiggyVaultInfo memory info = PiggyVaultInfo({
            vaultAddress: address(vault),
            lockEnd: block.timestamp + lockDuration,
            isERC20: isERC20,
            tokenAddress: tokenAddress,
            createdAt: block.timestamp
        });

        userVaults[msg.sender].push(info);

        emit VaultCreated(msg.sender, address(vault), info.lockEnd);
    }

    function getUserVaults(address user) external view returns (PiggyVaultInfo[] memory) {
        return userVaults[user];
    }

    function getVaultCount(address user) external view returns (uint256) {
        return userVaults[user].length;
    }
}