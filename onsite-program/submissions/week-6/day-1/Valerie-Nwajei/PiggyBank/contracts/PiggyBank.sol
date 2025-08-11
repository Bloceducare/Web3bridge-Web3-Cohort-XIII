// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "../Interfaces/IERC_20.sol";
import "../Interfaces/IPiggy.sol";

contract PiggyBank is Ipiggy {
    Accounts[] public users;
    mapping(address => Accounts[]) public userAccounts;
    uint256 public nextAccountId;
    address public owner;

    constructor(address _owner) {
        owner = _owner;
        nextAccountId = 1;
    }

    function create_account(
        string memory _name,
        address _tokenAddress,
        uint256 _unlockTime,
        AccountType _accountType
    ) external {
        require(
            block.timestamp < _unlockTime,
            "Unlock time should be in the future"
        );
        if (_accountType == AccountType.ERC_20) {
            require(_tokenAddress != address(0), "Invalid Address");
        }
        if (_accountType == AccountType.ETHERS) {
            require(
                _tokenAddress == address(0),
                "Token address must be zero for ethers"
            );
        }
        Accounts memory _newUser = Accounts(
            _name,
            _tokenAddress,
            nextAccountId,
            0,
            _unlockTime,
            _accountType
        );
        userAccounts[msg.sender].push(_newUser);
        users.push(_newUser);
        nextAccountId++;
    }

    function deposit(
        address _tokenAddress,
        uint256 _id,
        uint256 _amount
    ) external payable {
        require(_id < nextAccountId, "Invalid user");
        Accounts storage account = userAccounts[msg.sender][_id - 1];

        for (uint i; i < users.length; i++) {
            if (users[i].accountType == AccountType.ETHERS) {
                require(_amount > 0, "Cannot send zero ethers");
                account.balance += _amount;
            } else {
                require(_tokenAddress != address(0), "Invalid token address");
                require(_amount > 0, "Invalid amount");
                account.balance += _amount;
            }
        }
    }

    function withdraw(
        address _tokenAddress,
        uint256 _id,
        uint256 _amount
    ) external payable {
        require(_id < nextAccountId, "Invalid user");
        Accounts storage account = userAccounts[msg.sender][_id - 1];
        require(_amount > 0, "Invalid amount");
        require(account.balance >= _amount, "Insufficient balance");

        if (block.timestamp <= account.unlockTime) {
            require(_amount > 0, "Invalid Amount");
            uint256 fee = (_amount * 3) / 100;
            uint256 payoutAmount = _amount - fee;
            for (uint i; i < users.length; i++) {
                if (users[i].accountType == AccountType.ETHERS) {
                    payable(msg.sender).transfer(payoutAmount);
                    payable(owner).transfer(fee);
                    account.balance -= _amount;
                } else {
                    require(
                        _tokenAddress != address(0),
                        "Invalid token address"
                    );
                    IERC20 token = IERC20(_tokenAddress);
                    token.transfer(msg.sender, payoutAmount);
                    account.balance -= payoutAmount;
                }
            }
        } else {
            for (uint i; i < users.length; i++) {
                if (users[i].accountType == AccountType.ETHERS) {
                    payable(msg.sender).transfer(_amount);
                    account.balance -= _amount;
                } else {
                    require(
                        _tokenAddress != address(0),
                        "Invalid token address"
                    );
                    require(_amount > 0, "Invalid amount");
                    IERC20 token = IERC20(_tokenAddress);
                    token.transfer(msg.sender, _amount);
                    account.balance -= _amount;
                }
            }
        }
    }

    function get_users() external view returns (Accounts[] memory) {
        return users;
    }

    function get_Balances(
        address _user,
        uint256 _id
    ) external view returns (uint256) {
        require(msg.sender == _user, "You are not the owner of this account");
        require(_id < nextAccountId, "Invalid account details");
        return userAccounts[_user][_id - 1].balance;
    }
}
