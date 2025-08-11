// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import './IERC20.sol';

contract Piggy {
    uint public unlockTime;
    address payable public owner;
    address payable public admin;
    address public tokenAddress; 
    
    event Withdrawal(uint amount, uint when);
    event Deposit(uint amount, uint when);

    constructor(uint _unlockTime, address payable _admin, address _tokenAddress) payable {
        require(
            block.timestamp < _unlockTime,
            "Unlock time should be in the future"
        );
        
        unlockTime = _unlockTime;
        owner = payable(msg.sender);
        admin = _admin;
        tokenAddress = _tokenAddress; 
        
        if (msg.value > 0) {
            require(_tokenAddress == address(0), "Cannot send ETH for ERC20 piggy bank");
            emit Deposit(msg.value, block.timestamp);
        }
    }

    function depositETH() external payable {
        require(tokenAddress == address(0), "This piggy bank is for ERC20 tokens");
        require(msg.sender == owner, "Only owner can deposit");
        require(msg.value > 0, "Must deposit some ETH");
        
        emit Deposit(msg.value, block.timestamp);
    }

    function depositERC20(uint256 _amount) external {
        require(tokenAddress != address(0), "This piggy bank is for ETH");
        require(msg.sender == owner, "Only owner can deposit");
        require(_amount > 0, "Must deposit some tokens");
        
        IERC20(tokenAddress).transferFrom(msg.sender, address(this), _amount);
        emit Deposit(_amount, block.timestamp);
    }

    function withdraw() public {
        require(msg.sender == owner, "You aren't the owner");
        
        uint256 balance = getBalance();
        require(balance > 0, "No funds to withdraw");
        
        if(block.timestamp >= unlockTime) {
            if(tokenAddress == address(0)) {
                owner.transfer(balance);
            } else {
                IERC20(tokenAddress).transfer(owner, balance);
            }
            emit Withdrawal(balance, block.timestamp); 
        } else {
            uint256 adminFee = (balance * 3) / 100;
            uint256 ownerAmount = balance - adminFee;
            
            if(tokenAddress == address(0)) {
                admin.transfer(adminFee);
                owner.transfer(ownerAmount);
            } else {
                IERC20(tokenAddress).transfer(admin, adminFee);
                IERC20(tokenAddress).transfer(owner, ownerAmount);
            }
            emit Withdrawal(ownerAmount, block.timestamp);
        }
    }

    function getBalance() public view returns (uint256) {
        if(tokenAddress == address(0)) {
            return address(this).balance;
        } else {
            return IERC20(tokenAddress).balanceOf(address(this));
        }
    }

    function isETH() external view returns (bool) {
        return tokenAddress == address(0);
    }

    receive() external payable {
        require(tokenAddress == address(0), "This piggy bank doesn't accept ETH");
        require(msg.sender == owner, "Only owner can deposit");
        emit Deposit(msg.value, block.timestamp);
    }
}