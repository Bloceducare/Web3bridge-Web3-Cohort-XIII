//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./PiggyBank.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract PiggyBankFactory is Ownable, ReentrancyGuard {
    address[] public allBanks;
    mapping(address => address[]) public banksByOwner;
    mapping(address => bool) public supportedTokens;
    uint256 public totalBanksCreated;

    event PiggyBankCreated(
        address indexed owner,
        address indexed bankAddress,
        uint256 bankId
    );
    event GlobalTokenSupportUpdated(address indexed token, bool supported);
    event PenaltyReceived(
        address indexed from,
        address indexed token,
        uint256 amount
    );

    constructor() {
        totalBanksCreated = 0;

        supportedTokens[address(0)] = true; // ETH (represented as zero address)
    }

    function createPiggyBank() external returns (address bankAddress) {
        totalBanksCreated++;

        PiggyBank newBank = new PiggyBank(owner(), msg.sender);
        bankAddress = address(newBank);

        _initializeBankTokens(newBank);

        allBanks.push(bankAddress);
        banksByOwner[msg.sender].push(bankAddress);

        emit PiggyBankCreated(msg.sender, bankAddress, totalBanksCreated);

        return bankAddress;
    }

    function updateGlobalTokenSupport(
        address _token,
        bool _supported
    ) external onlyOwner {
        require(_token != address(0), "Cannot modify ETH support");
        supportedTokens[_token] = _supported;
        emit GlobalTokenSupportUpdated(_token, _supported);
    }

    function updateTokenSupportAllBanks(
        address _token,
        bool _supported
    ) external onlyOwner {
        supportedTokens[_token] = _supported;

        for (uint256 i = 0; i < allBanks.length; i++) {
            PiggyBank bank = PiggyBank(allBanks[i]);
            bank.updateTokenSupport(_token, _supported);
        }

        emit GlobalTokenSupportUpdated(_token, _supported);
    }

    function _initializeBankTokens(PiggyBank _bank) internal {}

    function withdrawPenalties(
        address _token,
        uint256 _amount
    ) external onlyOwner nonReentrant {
        if (_token == address(0)) {
            require(
                address(this).balance >= _amount,
                "Insufficient ETH balance"
            );
            payable(owner()).transfer(_amount);
        } else {
            IERC20 token = IERC20(_token);
            require(
                token.balanceOf(address(this)) >= _amount,
                "Insufficient token balance"
            );
            require(token.transfer(owner(), _amount), "Token transfer failed");
        }
    }

    function getAllBanks() external view returns (address[] memory) {
        return allBanks;
    }

    function getBanksByOwner(
        address _owner
    ) external view returns (address[] memory) {
        return banksByOwner[_owner];
    }

    function getMyBanks() external view returns (address[] memory) {
        return banksByOwner[msg.sender];
    }

    function getTotalBanksCreated() external view returns (uint256) {
        return totalBanksCreated;
    }

    function isTokenSupported(address _token) external view returns (bool) {
        return supportedTokens[_token];
    }

    function getFactoryAdmin() external view returns (address) {
        return owner();
    }

    function getUserStats(
        address _user
    )
        external
        view
        returns (
            uint256 totalBanks,
            uint256 totalAccounts,
            address[] memory bankAddresses
        )
    {
        bankAddresses = banksByOwner[_user];
        totalBanks = bankAddresses.length;

        for (uint256 i = 0; i < bankAddresses.length; i++) {
            PiggyBank bank = PiggyBank(bankAddresses[i]);
            totalAccounts += bank.getUserAccountCount(_user);
        }
    }

    receive() external payable {
        emit PenaltyReceived(msg.sender, address(0), msg.value);
    }

    fallback() external payable {
        emit PenaltyReceived(msg.sender, address(0), msg.value);
    }
}
