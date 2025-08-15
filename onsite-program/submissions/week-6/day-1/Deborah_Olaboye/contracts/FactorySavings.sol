// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IPiggyBank.sol";
import "./PiggyBank.sol";

contract FactorySavings {
    address public admin;

    struct BankDetails {
        string bankName;
        address bankAddress;
    }

    mapping(address => BankDetails[]) public userBanks;

    event BankCreated(address indexed creator, address bank, string name);
    event BankJoined(address indexed joiner, address bank, uint256 amount);

    constructor() {
        admin = msg.sender;
    }

    function createBank( string memory _bankName, address _tokenAddress, uint256 _amount, uint256 _lockPeriod ) external payable {
        address newBank;
        if (_tokenAddress == address(0)) {
            require(msg.value == _amount, "Incorrect ETH sent");
            newBank = address(new PiggyBank{value: msg.value}( msg.sender, _tokenAddress, _amount, _lockPeriod, admin));
        } else {
            newBank = address(new PiggyBank( msg.sender, _tokenAddress, _amount, _lockPeriod, admin));
        }

        userBanks[msg.sender].push(BankDetails({ bankName: _bankName, bankAddress: newBank}));

        emit BankCreated(msg.sender, newBank, _bankName);
    }

    function joinBank( address userAddress, uint256 bankId, uint256 _amount) external payable {
        require(bankId < userBanks[userAddress].length, "Invalid bank index");

        address bankAddress = userBanks[userAddress][bankId].bankAddress;
        IPiggyBank bank = IPiggyBank(bankAddress);

        if (bank.tokenAddress() == address(0)) {
            require(msg.value == _amount, "Incorrect ETH sent");
            bank.deposit{value: msg.value}(_amount);
        } else {
            IERC20 token = IERC20(bank.tokenAddress());
            token.transferFrom(msg.sender, bankAddress, _amount);
            bank.deposit(_amount);
        }

        emit BankJoined(msg.sender, bankAddress, _amount);
    }

    function getUserBanks(address user) external view returns (BankDetails[] memory) {
        return userBanks[user];
    }

    function getTotalBanks(address user) external view returns (uint256) {
        return userBanks[user].length;
    }

    function getTotalBalance(address user, address token) external view returns (uint256 total) {
        BankDetails[] memory banks = userBanks[user];
        total = 0;
        for (uint256 i = 0; i < banks.length; i++) {
            IPiggyBank bank = IPiggyBank(banks[i].bankAddress);
            if (bank.tokenAddress() == token) {
                total += bank.getBalance();
            }
        }
    }
}
