// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract IPiggyBank {
    struct Wallet {
        uint walletId;
        address owner;
        WalletType walletType;
        uint balance;
        address tokenAddress;
        uint lockPeriod;
        
    }

    enum WalletType {
        DEFAULT, ETHER, ERC20
    }

    function createAccount(string name, Account token) external;
    function depositERC20(uint _walletId, address _token, uint _amount, bool _isLocked) external view payable returns (uint balance);
    function depositEther(uint _walletId, address _token, uint _amount, bool _isLocked) external view payable returns (uint balance);
    function withdraw(uint _walletId, uint amount) external view;
    
}