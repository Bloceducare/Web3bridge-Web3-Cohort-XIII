// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IPiggyBank.sol";
import "./libraries/Errors.sol";

contract PiggyBank is IPiggyBank {
    address public immutable override owner;
    address public immutable override admin;
    uint256 public immutable override unlockTime;
    address public immutable override asset; // address(0) for Ether, else ERC20 token address

    constructor(address _owner, address _admin, uint256 _unlockTime, address _asset) {
        owner = _owner;
        admin = _admin;
        unlockTime = _unlockTime;
        asset = _asset;
    }

    function deposit(uint256 amount) external payable override {
        if (amount == 0) revert Errors.ZeroAmount();
        if (asset == address(0)) {
            if (msg.value != amount) revert Errors.IncorrectEtherValue(amount, msg.value);
        } else {
            if (msg.value != 0) revert Errors.EtherSentForERC20();
            IERC20(asset).transferFrom(msg.sender, address(this), amount);
        }

        emit Deposited(msg.sender, amount);
    }

    function withdraw(uint256 amount) external override {
        if (msg.sender != owner) revert Errors.OnlyOwner(msg.sender);
        if (amount == 0) revert Errors.ZeroAmount();

        uint256 balance = getBalance();
        if (amount > balance) revert Errors.InsufficientBalance(amount, balance);

        uint256 fee = 0;
        if (block.timestamp < unlockTime) {
            fee = (amount * 3) / 100; // 3% fee for early withdrawal
        }
        uint256 toUser = amount - fee;

        if (asset == address(0)) {
            if (fee > 0) {
                payable(admin).transfer(fee);
            }
            payable(owner).transfer(toUser);
        } else {
            if (fee > 0) {
                IERC20(asset).transfer(admin, fee);
            }
            IERC20(asset).transfer(owner, toUser);
        }

        emit Withdrawn(owner, toUser, fee);
    }

    function getBalance() public view override returns (uint256) {
        return asset == address(0) ? address(this).balance : IERC20(asset).balanceOf(address(this));
    }
}