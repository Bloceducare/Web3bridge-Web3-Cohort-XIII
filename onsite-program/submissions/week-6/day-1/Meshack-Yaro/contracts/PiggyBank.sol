// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IPiggyBank} from "./interface/IPiggyBank.sol";
import {IERC20} from "@openzeppelin/contracts/ERC20/IERC20.sol";


contract PiggyBank is IPiggyBank {

    mapping(address => uint) public nextWalletId;
    mapping(address => Wallet[]) public walletsByOwner;

    function createAccount() external memory {
        uint walletId = nextWalletId[msg.sender]++;
        walletsByOwner[msg.sender].push(
            Wallet({
                owner: msg.sender,
                walletType: WalletType.DEFAULT;
                tokenAddress: address(0);
                balance: 0;
                isLocked: false;

            });
        )
    }

    function depositERC20(uint _walletId, WalletType _walletType, address _token, uint _amount, bool _isLocked) external view payable returns (uint balance) {
        Wallet memory wallet = walletsByOwner(_walletId);
        require(acc.owner == msg.sender, "Not account owner");
        // if (wallet.owner == msg.sender) {
        require(_walletType != TokenType.DEFAULT, "Invalid token type");
        require(wallet.WalletType == WalletType.DEFAULT || acc.tokenType == _tokenType, "Token type already set differently");

        if (wallet.walletType == WalletType.DEFAULT) {
            wallet.walletType = _walletType;
            if ()

        }

        }
    }
}