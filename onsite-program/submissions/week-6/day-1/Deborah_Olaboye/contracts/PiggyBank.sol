// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IPiggyBank.sol";

contract PiggyBank is IPiggyBank {
    address public owner;
    address public override tokenAddress;
    uint256 public override lockPeriod;
    address public factoryAdmin;
    bool public withdrawn;
    uint256 private _balance;

    constructor( address _owner, address _tokenAddress, uint256 _amount, uint256 _lockDuration, address _factoryAdmin) payable {
        owner = _owner;
        tokenAddress = _tokenAddress;
        factoryAdmin = _factoryAdmin;
        lockPeriod = block.timestamp + _lockDuration;

        if (_tokenAddress == address(0)) {
            require(msg.value == _amount, "Incorrect ETH sent");
            _balance = msg.value;
        } else {
            _balance = _amount;
        }
    }

    function deposit(uint256 _amount) external payable override {
        if (tokenAddress == address(0)) {
            require(msg.value == _amount, "Incorrect ETH sent");
            _balance += msg.value;
        } else {
            IERC20(tokenAddress).transferFrom(msg.sender, address(this), _amount);
            _balance += _amount;
        }
    }

    function withdraw() external override {
        require(msg.sender == owner, "Not owner");
        require(!withdrawn, "Already withdrawn");

        withdrawn = true;
        uint256 fee = 0;
        uint256 payout = _balance;

        if (block.timestamp < lockPeriod) {
            fee = (_balance * 3) / 100;
            payout = _balance - fee;
        }

        _balance = 0;

        if (tokenAddress == address(0)) {
            payable(owner).transfer(payout);
            if (fee > 0) payable(factoryAdmin).transfer(fee);
        } else {
            IERC20 token = IERC20(tokenAddress);
            token.transfer(owner, payout);
            if (fee > 0) token.transfer(factoryAdmin, fee);
        }
    }

    function getBalance() external view override returns (uint256) {
        return _balance;
    }
}
