// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { IPiggyBank } from "../interfaces/IPiggyBank.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";


contract PiggyBank is IPiggyBank {

    error InvalidWalletId();
    error NoTokensSent();
    error WalletAlreadySetForOtherTokenType();
    error NotAccountOwner();
    error InsuffucuentBalance();


    mapping(address => uint) public nextWalletId;
    mapping(address => Wallet[]) public walletsByOwner;
    
    uint public constant PENALTY_PERCENT = 3;
    address public deployer;



    receive() external payable {}
    fallback() external payable {}

    constructor() {
        deployer = msg.sender;
    }


    function createAccount() external {
        uint walletId = nextWalletId[msg.sender]++;
        walletsByOwner[msg.sender].push(
            Wallet({
                walletId: walletId,
                owner: msg.sender,
                walletType: WalletType.DEFAULT,
                tokenAddress: address(0),
                balance: 0,
                lockUntil: 0,
                createdAt: 0

            })
        );
    }

    function depositEther(uint _walletId, uint _lockPeriod) external payable {
        if (_walletId >= walletsByOwner[msg.sender].length) revert InvalidWalletId();
        Wallet storage wallet = walletsByOwner[msg.sender][_walletId];

        if (msg.value == 0) revert NoTokensSent();
        if (wallet.walletType != WalletType.DEFAULT && wallet.walletType != WalletType.ETHER) {
            revert WalletAlreadySetForOtherTokenType();
        }

        wallet.walletType = WalletType.ETHER;
        wallet.balance += msg.value;
        wallet.lockUntil = block.timestamp + _lockPeriod;
    }

    function depositERC20(uint _walletId, address _token, uint _amount, uint _lockPeriod) external payable {
        if (_walletId >= walletsByOwner[msg.sender].length) revert InvalidWalletId();

        Wallet storage wallet = walletsByOwner[msg.sender][_walletId];
        if (_amount <= 0) revert NoTokensSent();

        if (wallet.walletType != WalletType.DEFAULT && wallet.walletType != WalletType.ERC20) revert WalletAlreadySetForOtherTokenType();

        IERC20(_token).transferFrom(msg.sender, address(this), _amount);

        wallet.walletType = WalletType.ERC20;
        wallet.tokenAddress = _token;
        wallet.balance += _amount;
        wallet.lockUntil = block.timestamp + _lockPeriod; 
    }


    function withdraw(uint _walletId, uint _amount) external {
        if (_walletId >= walletsByOwner[msg.sender].length) revert InvalidWalletId();
        Wallet storage wallet = walletsByOwner[msg.sender][_walletId];
        if (wallet.owner != msg.sender) revert NotAccountOwner();
        if (wallet.balance < _amount) revert InsuffucuentBalance();

        uint penalty;
        if (block.timestamp < wallet.createdAt + wallet.lockUntil) {
            penalty = (_amount * PENALTY_PERCENT) / 100;
            _transfer(wallet.walletType, wallet.tokenAddress, deployer, penalty);
        }

        uint payout = _amount - penalty;
        wallet.balance -= _amount;
        _transfer(wallet.walletType, wallet.tokenAddress, msg.sender, payout);
    }

    function _transfer(WalletType _type, address _tokenAddress, address _to, uint256 _amount) internal {
        if (_type == WalletType.ETHER) {
            payable(_to).transfer(_amount);
        } else if (_type == WalletType.ERC20) {
            IERC20(_tokenAddress).transfer(_to, _amount);
        }
    }

    function getWallet(uint _walletId) external view returns (Wallet memory) {
        if (_walletId >= walletsByOwner[msg.sender].length) revert InvalidWalletId();
        return walletsByOwner[msg.sender][_walletId];
    }
}