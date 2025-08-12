// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PiggyWallet {

    error INVALID_ACCOUNT_TYPE();
    error INVALID_FUNCTION_CALL();
    error TRANSACTION_NOT_SUPPORTED();
    error UNAUTHORISED();
    error INSUFFICIENT_BALANCE();

    string public _name;
    uint private balance;
    address private owner;
    uint public walletId;
    address private _contractAddress;
    AccountType public accountType;
    bool private isLocked;
    uint public unlockTime;
    address private admin;
    enum AccountType{DEFAULT, ETHERS, ERC20}

    constructor(uint id, string memory name, AccountType _accountType, address contractAddress){
        if(_accountType == AccountType.DEFAULT){
            revert INVALID_ACCOUNT_TYPE();
        }
        owner= msg.sender;
        _name= name;
        accountType= _accountType;
        walletId= id;
        if (contractAddress != address(0)) {
            _contractAddress = contractAddress;
        } else {
            _contractAddress = address(0);
        }
    }

    function deposit(uint price) external returns(bool){
        if(accountType!=AccountType.ERC20) {
            revert TRANSACTION_NOT_SUPPORTED();
        }

        IERC20 erc20 =  IERC20(_contractAddress);

        if(erc20.balanceOf(msg.sender)<price){
            revert INSUFFICIENT_BALANCE();
        }
        erc20.approve(address(this), price);
        bool isTransferred = erc20.transferFrom(msg.sender, address(this), price);
        require(isTransferred, "Transfer Failed");
        balance += price;
        return true;
    }

    receive() external payable {}
    fallback() external payable {}

    function depositEth() external payable{
        if(accountType!=AccountType.ETHERS) {
            revert TRANSACTION_NOT_SUPPORTED();
        }
        if(msg.sender!=owner) revert UNAUTHORISED();
        balance+= msg.value;
    }

    function getBalance() external view returns(uint){
        return balance;
    }

    function withdrawTo(address receiver,uint price) external{
           if(accountType != AccountType.ERC20) revert TRANSACTION_NOT_SUPPORTED();
        if(msg.sender != owner) revert UNAUTHORISED();
        if(balance < price) revert INSUFFICIENT_BALANCE();

        IERC20 erc20 = IERC20(_contractAddress);

        if(isLocked && block.timestamp < unlockTime) {
            uint fee = (price * 3) / 1000;
            uint amountAfterFee = price - fee;

            balance -= price;
            require(erc20.transfer(admin, fee), "Fee transfer failed");
            require(erc20.transfer(receiver, amountAfterFee), "Transfer failed");
        } else {
            if(isLocked && block.timestamp >= unlockTime){
                isLocked = false;
                unlockTime = 0;
            }
            balance -= price;
            require(erc20.transfer(receiver, price), "Transfer failed");
        }
    }

    function toggle() private {
        isLocked = !isLocked;
    }
    function setAdmin(address adminAddress) external {
        admin= adminAddress;
    }
    function lockFunds(uint durationSeconds) external {
        if(balance == 0) revert INSUFFICIENT_BALANCE();
        if(msg.sender != owner) revert UNAUTHORISED();
        unlockTime = block.timestamp + durationSeconds;
        isLocked = true;
    }
    function withdrawEthTo(address payable receiver, uint amount) external {
        if(msg.sender != admin) revert UNAUTHORISED();
        if(accountType != AccountType.ETHERS) revert TRANSACTION_NOT_SUPPORTED();
        if(amount > balance) revert INSUFFICIENT_BALANCE();

        balance -= amount;
        (bool sent, ) = receiver.call{value: amount}("");
        require(sent, "ETH transfer failed");
    }
 function withdrawTokensTo(address receiver, uint amount) external {
    if(msg.sender != admin) revert UNAUTHORISED();
    if(accountType != AccountType.ERC20) revert TRANSACTION_NOT_SUPPORTED();
    if(amount > balance) revert INSUFFICIENT_BALANCE();

    balance -= amount;
    IERC20 token = IERC20(_contractAddress);
    bool success = token.transfer(receiver, amount);
    require(success, "Token transfer failed");
}


}
