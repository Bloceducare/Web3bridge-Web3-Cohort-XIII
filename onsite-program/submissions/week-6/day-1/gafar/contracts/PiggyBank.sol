// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interface/IAccount.sol";
import "./interface/IERC20.sol";

error Invalid_Address();
error Insufficient_Balance();
error Invalid_savingsId();
error Nothing_to_withdraw();
error ETH_withdrawal_failed();
error Token_transfer_failed();
error Invalid_amount();
error ETH_mismatch();


contract PiggyBank is IAccount, Ownable {
    uint256 private nextId;

    mapping(address => SavingInstance[]) users;
    constructor() Ownable(msg.sender) {}


    function createAccount(string memory _savings_name, uint256 _lock_period, address _token_address, bool _IERC20, uint256 _amount) external payable {
        if (_IERC20 && _token_address == address(0)) revert Invalid_Address();
        if (_amount == 0) revert Invalid_amount();

        uint256 amount = _amount;

        if (_IERC20) {
            if(_amount <= 0) revert Invalid_amount();

            bool success = IERC20(_token_address).transferFrom(msg.sender, address(this), _amount);
            if (!success) revert Token_transfer_failed();
        } else {
            if(msg.value != _amount) revert ETH_mismatch();
            amount = msg.value;
        }

        SavingInstance memory saving = SavingInstance({
            savingsId: ++nextId,
            savingsName: _savings_name,
            isERC20: _IERC20,
            tokenAddress: _token_address,
            amount: _amount,
            lockPeriod: _lock_period,
            createdAt: block.timestamp
        });

        users[msg.sender].push(saving);
    }

    function withdrawMoney(uint256 savingsId) external payable {
        SavingInstance[] storage instances = users[msg.sender];
        if(savingsId > instances.length) revert Invalid_savingsId();

        SavingInstance storage instance = instances[savingsId];
        // if(block.timestamp <= instance.createdAt + instance.lockPeriod) revert Lock_period_not_over();
        uint256 amount = instance.amount;
        if(amount == 0) revert Nothing_to_withdraw();

        uint256 payoutAmount = amount;

        if (block.timestamp < instance.createdAt + instance.lockPeriod) {
            uint256 penalty = (amount * 3) / 100;
            payoutAmount = amount - penalty;

            if (instance.isERC20) {
                IERC20(instance.tokenAddress).transfer(owner(), penalty);
            } else {
                (bool sent, ) = owner().call{value: penalty}("");
                if (!sent) revert ETH_withdrawal_failed();
            }
        }

        if (instance.isERC20) {
            IERC20(instance.tokenAddress).transfer(msg.sender, payoutAmount);
        } else {
            (bool success, ) = msg.sender.call{value: payoutAmount}("");
            if(!success) revert ETH_withdrawal_failed();
        }

        emit Withdrawal(payoutAmount, block.timestamp);
    }
    
    function depositAmount(uint256 savingsId, uint256 amount) external payable {
        SavingInstance[] storage instances = users[msg.sender];
        if (savingsId >= instances.length) revert Invalid_savingsId();

        SavingInstance storage instance = instances[savingsId];

        if (instance.isERC20) {
            if (amount == 0) revert Insufficient_Balance();
            bool success = IERC20(instance.tokenAddress).transferFrom(
                msg.sender,
                address(this),
                amount
            );
            if (!success) revert Token_transfer_failed();
            instance.amount += amount;
            emit Deposit(msg.sender, amount, true, block.timestamp);
        } else {
            if (msg.value == 0) revert Insufficient_Balance();
            instance.amount += msg.value;
            emit Deposit(msg.sender, msg.value, false, block.timestamp);
        }
    }

    function getSavingInstances(address userAddress) external view returns (SavingInstance[] memory) {
        return users[userAddress];
    }

    function getSavingInstance(address userAddress, uint256 savingsId) external view returns (SavingInstance memory) {
        if(savingsId >= users[userAddress].length) revert Invalid_savingsId();
        return users[userAddress][savingsId];
    }

    receive() external payable {}
    fallback() external payable {}
}
