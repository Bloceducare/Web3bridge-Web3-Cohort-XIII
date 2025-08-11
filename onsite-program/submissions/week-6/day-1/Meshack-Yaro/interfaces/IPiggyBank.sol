// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract IPiggyBank {
    struct Wallet {
        uint walletId;
        address owner;
        WalletType walletType;
        uint balance;
        address tokenAddress;
        uint lockDuration;
        
    }

    enum WalletType {
        DEFAULT, ETHER, ERC20
    }

    function createAccount(string name, Account token) external;
    function depositEther(uint _walletId, uint _lockPeriodSeconds) external view payable;
    function depositERC20(uint _walletId, address _token, uint _amount, uint _lockPeriodSeconds) external view payable;
    function withdraw(uint _walletId, uint amount) external view;
    
}