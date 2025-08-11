// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {IERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Savings_Account {
    string name;
    bool isEther;
    address owner;
    address tokenaddress;
    uint LockPeriod;
    uint createdAt;
    uint balance;
    address factoryAdmin;
    uint constant BREAKING_FEE = 3;

    constructor(
        string memory _name,
        bool _isEther,
        uint _LockPeriod,
        address _owner,
        address _admin
    ) {
        name = _name;
        isEther = _isEther;
        owner = _owner;
        LockPeriod = _LockPeriod;
        createdAt = block.timestamp;
        factoryAdmin = _admin;
    }
    modifier onlyOwner() {
        require(msg.sender == owner, "You are not the owner of this account.");

        _;
    }
    function deposit() external payable onlyOwner {
        if (isEther) {
            require(msg.value > 0, "Value must be greater than 0");
            balance += msg.value;
        } else {
            revert("use your token");
        }
    }

    function depositTokens(uint amount) external onlyOwner {
        require(!isEther, "use deposit");
        require(amount > 0, "invalid amount");
        bool success = IERC20(tokenaddress).transferFrom(
            msg.sender,
            address(this),
            amount
        );
        require(success, "failed");
        balance += amount;
    }

    function withdraw(uint amount) external onlyOwner {
        require(amount > 0 && amount <= balance, "invalid amount");
        uint unlockTime = createdAt + LockPeriod;
        bool unlock = block.timestamp < unlockTime;
        uint fee = unlock ? (amount * BREAKING_FEE) / 100 : 0;
        uint pay_out = amount - fee;
        balance -= amount;

        if (fee > 0) {
            payable(factoryAdmin).transfer(fee);
        }

        payable(owner).transfer(pay_out);
    }

    function withdrawTokens(uint amount) external onlyOwner {
        require(!isEther, "use withdraw");
        require(amount > 0 && amount <= balance, "invalid amount");

        uint unlockTime = createdAt + LockPeriod;
        bool unlock = block.timestamp < unlockTime;
        uint fee = unlock ? (amount * BREAKING_FEE) / 100 : 0;
        uint pay_out = amount - fee;

        balance -= amount; // Update balance first
        if (fee > 0) {
            require(
                IERC20(tokenaddress).transfer(factoryAdmin, fee),
                "Fee transfer failed"
            );
        }
        require(
            IERC20(tokenaddress).transfer(owner, pay_out),
            "Payout transfer failed"
        );
    }

    receive() external payable {
        require(isEther, "not ether");
        balance += msg.value;
    }
}
