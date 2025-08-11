// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IPiggyBank {
    struct Wallet {
        uint walletId;
        address owner;
        WalletType walletType;
        uint balance;
        address tokenAddress;
        uint lockUntil: 0;
        uint createdAt: 0;
        
    }

    enum WalletType {
        DEFAULT, ETHER, ERC20
    }

    function createAccount() external;
    function depositEther(uint _walletId, uint _lockPeriod) external payable;
    function depositERC20(uint _walletId, address _token, uint _amount, uint _lockPeriodSeconds) external payable;
    function withdraw(uint _walletId, uint _amount) external;
    
}