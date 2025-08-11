// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IPiggyBank} from "./interface/IPiggyBank.sol";
import {IERC20} from "@openzeppelin/contracts/ERC20/IERC20.sol";


contract PiggyBank is IPiggyBank {

    error InvalidWalletId();
    error NoTokensSent();
    error WalletAlreadySetForEther();
    error NotAccountOwner();

    mapping(address => uint) public nextWalletId;
    mapping(address => Wallet[]) public walletsByOwner;


    receive() external payable {}
    fallBack() external payable {}

    constructor() {
        deployer = msg.sender;
    }


    function createAccount() external memory {
        uint walletId = nextWalletId[msg.sender]++;
        walletsByOwner[msg.sender].push(
            Wallet({
                owner: msg.sender,
                walletType: WalletType.DEFAULT;
                tokenAddress: address(0);
                balance: 0;
                lockDuration: 0;

            });
        )
    }

       function depositEther(uint _walletId, uint _lockPeriodSeconds) external payable {
        require(walletId < walletsByOwner[msg.sender].length, "Invalid account ID");
        Wallet storage wallet = walletsByOwner[msg.sender][walletId];

        require(msg.value > 0, "No Tokens sent");
        require(wallet.WalletType == WalletType.DEFAULT || wallet.walletType == WalletType.ETHER, "Account already set for ERC20");

        wallet.walletType = WalletType.ETHER;
        wallet.balance += msg.value;
        wallet.lockUntil = block.timestamp + _lockPeriodSeconds;
    }

    function depositERC20(uint _walletId, address _token, uint _amount, uint _lockPeriodSeconds) external payable {
        if (walletId >= walletsByOwner[msg.sender].length) revert InvalidWalletId();

        Wallet storage wallet = walletsByAddress[msg.sender][walletId];
        if (_amount <= 0) revert NoTokensSent();

        if (wallet.walletType != WalletType.DEFAULT || wallet.walletType != WalletType.ERC20) revert WalletAlreadySetForEther();

        IERC20(_token).transferFrom(msg.sender, , _amount);**********************

        wallet.walletType = wallet.WalletType.ERC20;
        wallet.tokenAddress = _token;
        wallet.balance += _amount;
        wallet.lockDuration =block.timestamp + lockPeriodSecond; 
    }


    function withdraw(uint _walletId, uint _amount) external view payable returns (uint balance) {
        Wallet storage wallet = walletsByOwner(_walletId);
        require(wallet.owner == msg.sender, "Not account owner");
        if (wallet.owner != msg.sender) revert NotAccountOwner();
        require(_walletType != TokenType.DEFAULT, "Invalid token type");
        require(wallet.WalletType == WalletType.DEFAULT || wallet.tokenType == _tokenType, "Token type already set differently");

        if (wallet.walletType == WalletType.DEFAULT) {
            wallet.walletType = _walletType;
            if (_walletType == WalletType.ERC20) {
                require(_tokenAddress != address(0), "ERC20 Address Required");
                wallet.tokenAddress = _tokenAddress;
            }

        }

        if (wallet.walletType == WalletType.ETHER) {
            require(msg.value = _amount, "Ether Amount Mismatch");
        }else if (_walletType == WalletType.ERC20) [
            IERC20(acc.tokenAddress).transferFrom(msg.sender, address(this), _amount);
        ]
        wallet.balance += _amount;
        wallet.lockPeriod = block.timestamp + _lockDuration;
    }

    function getAllAccounts(address _owner) external view returns(Wallet[] memory) {
        return walletsByOwner[_owner];

    }
}