// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "./interfaces/IPiggyBankFactory.sol";
import "./interfaces/IPiggyBank.sol";
import "./PiggyBank.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./messages/Error.sol";

contract PiggyBankFactory is IPiggyBankFactory {
    address public admin;
    mapping(address => address[]) private userAccounts;
    uint256 public totalAccounts;

    event PiggyBankCreated(address indexed owner, address piggyBank, uint256 timestamp);
    event AdminFeesWithdrawn(address indexed token, address indexed to, uint256 amount, uint256 timestamp);
    event AdminChanged(address indexed oldAdmin, address indexed newAdmin);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can use this");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    receive() external payable {}
    fallback() external payable {}

    function createPiggyAccount() external returns (address) {
        address newAccount = address(new PiggyBank(msg.sender, admin, address(this)));
        userAccounts[msg.sender].push(newAccount);
        totalAccounts++;
        emit PiggyBankCreated(msg.sender, newAccount, block.timestamp);
        return newAccount;
    }

    function getUserAccountsAndBalance(address _user) 
        external 
        view 
        returns (address[] memory, uint256[] memory) 
    {
        address[] memory accounts = userAccounts[_user];
        uint256[] memory balances = new uint256[](accounts.length);

        for (uint256 i = 0; i < accounts.length; i++) {
            balances[i] = IPiggyBank(payable(accounts[i])).getBalance(); // ETH balance
        }
        return (accounts, balances);
    }

    function withdrawAdminFees(address payable _to) external onlyAdmin {
        uint256 amount = address(this).balance;
        if (amount == 0) {
            revert Error.NOTHING_TO_WITHDRAW();
        }
        (bool sent, ) = _to.call{value: amount}("");
        if (!sent) {
            revert Error.WITHDRAWER_FAILED();
        }
        emit AdminFeesWithdrawn(address(0), _to, amount, block.timestamp); // ETH fees
    }

    function withdrawERC20Fees(address _token, address _to) external onlyAdmin {
        uint256 amount = IERC20(_token).balanceOf(address(this));
        if (amount == 0) {
            revert Error.NOTHING_TO_WITHDRAW();
        }
        bool sent = IERC20(_token).transfer(_to, amount);
        if (!sent) {
            revert Error.WITHDRAWER_FAILED();
        }
        emit AdminFeesWithdrawn(_token, _to, amount, block.timestamp); // ERC20 fees
    }

    function changeAdmin(address _newAdmin) external onlyAdmin {
        require(_newAdmin != address(0), "Invalid address");
        emit AdminChanged(admin, _newAdmin);
        admin = _newAdmin;
    }

    function getTotalAccounts() external view returns (uint256) {
        return totalAccounts;
    }
}
