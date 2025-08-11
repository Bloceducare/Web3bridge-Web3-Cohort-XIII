// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./SavingsFactory.sol";

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from,address to,uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract SavingsAccount {
    address public owner;
    address public factoryAdmin;
    address public token;
    uint256 public lockPeriod;
    uint256 public createdAt;
    uint256 public balance;
    bool private entered;

    event Deposited(address indexed from, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount, uint256 fee, bool early);
    event ERC20Deposited(address indexed from, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "only owner");
        _;
    }

    modifier guard() {
        require(!entered, "reentrant");
        entered = true;
        _;
        entered = false;
    }

    constructor(address _owner, address _token, uint256 _lockPeriod, address _factoryAdmin) {
        require(_owner != address(0), "invalid owner");
        require(_factoryAdmin != address(0), "invalid admin");
        owner = _owner;
        token = _token;
        lockPeriod = _lockPeriod;
        createdAt = block.timestamp;
        factoryAdmin = _factoryAdmin;
    }

    function depositETH() external payable guard {
        require(token == address(0), "not ETH");
        require(msg.value > 0, "zero deposit");
        balance += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function depositERC20(uint256 amount) external guard {
        require(token != address(0), "not ERC20");
        require(amount > 0, "zero deposit");
        bool ok = IERC20(token).transferFrom(msg.sender, address(this), amount);
        require(ok, "transferFrom failed");
        balance += amount;
        emit ERC20Deposited(msg.sender, amount);
    }

    function withdraw() external onlyOwner guard {
        require(balance > 0, "zero balance");
        uint256 amount = balance;
        balance = 0;
        bool early = block.timestamp < createdAt + lockPeriod;
        uint256 fee = 0;
        if (early) {
            fee = (amount * 3) / 100;
        }
        uint256 payout = amount - fee;
        if (token == address(0)) {
            if (fee > 0) {
                (bool sentFee,) = factoryAdmin.call{value: fee}("");
                require(sentFee, "fee fail");
            }
            (bool sentPayout,) = owner.call{value: payout}("");
            require(sentPayout, "payout fail");
        } else {
            if (fee > 0) {
                require(IERC20(token).transfer(factoryAdmin, fee), "fee fail");
            }
            require(IERC20(token).transfer(owner, payout), "payout fail");
        }
        emit Withdrawn(owner, payout, fee, early);
    }

    function lockExpired() external view returns (bool) {
        return block.timestamp >= createdAt + lockPeriod;
    }

    function getBalance() external view returns (uint256) {
        return balance;
    }
}