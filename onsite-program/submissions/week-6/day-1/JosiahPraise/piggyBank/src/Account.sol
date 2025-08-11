//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Type} from "src/lib.sol";
import {IERC20} from "src/IERC20.sol";

contract Account {
    address public immutable owner;
    address public immutable admin;
    uint256 public balance;
    Type public savingsType;
    uint256 public lockPeriod;
    uint256 public lastStartOfLockPeriod;
    address tokenAddress;

    error Account__InvalidAccountType();
    error Account__InvalidTokenAddress();
    error Account__DepositFailed();
    error Account__UnAuthorized();
    error Account__AccountLocked();
    error Account__WithdrawalFailed();
    error Account__InsufficientFunds();
    error Account__ZeroAddressError();
    error Account__ReentrancyError();

    bool lock;

    event Deposit(address indexed sender, Type indexed accountType);
    event Withdrawal(address indexed owner, address indexed to, uint256 amount, Type indexed accountType);

    /// @notice ensures onlyOwner has access
    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert Account__UnAuthorized();
        }
        _;
    }

    modifier onlyAdminAndOwner() {
        if (msg.sender != owner && msg.sender != admin) {
            revert Account__UnAuthorized();
        }
        _;
    }

    /// @notice takes in parameters to create a new account - ERC20 or ETH account
    /// @dev reverts if the account is an ERC20 account and a user sends a zeroAddress--ignores otherwise
    constructor(address _admin, address _owner, uint256 _lockPeriod, Type _accountType, address _erc20Address) {
        owner = _owner;
        admin = _admin;
        savingsType = _accountType;
        lockPeriod = _lockPeriod;
        tokenAddress = _erc20Address;

        if (savingsType == Type.ERC20 && _erc20Address == address(0)) {
            revert Account__InvalidTokenAddress();
        }
        lastStartOfLockPeriod = block.timestamp;
    }

    /// @notice allows a user to send eth to their account
    /// @dev reverts if the account is an ERC20 account and not ether account
    /// @dev updates the user's balance and emits Deposit event if the deposit is successful
    function depositEth() external payable {
        if (savingsType == Type.ETHER) {
            balance += msg.value;
            emit Deposit(msg.sender, savingsType);
        } else {
            revert Account__InvalidAccountType();
        }
    }

    /// @notice allows a user to deposit an erc20 token into this account
    /// @dev user must have approved this account to take the respective amount of tokens
    /// @dev reverts if the token
    function depositERC20(uint256 value) external {
        if (savingsType != Type.ERC20) {
            revert Account__InvalidAccountType();
        }
        if (tokenAddress == address(0)) {
            revert Account__InvalidTokenAddress();
        }

        // attempt to collect transfer the token to this contract
        IERC20 tokenContract = IERC20(tokenAddress);

        balance += value;

        bool success = tokenContract.transferFrom(owner, address(this), value);

        if (!success) {
            revert Account__DepositFailed();
        }

        emit Deposit(owner, savingsType);
    }

    /// @notice allows a user to withdraw Eth from their account
    function withdrawETH(uint256 value, address to) external onlyOwner {
        if (lock) {
            revert Account__ReentrancyError();
        }
        if (to == address(0)) {
            revert Account__ZeroAddressError();
        }

        if (savingsType == Type.ERC20) {
            revert Account__InvalidAccountType();
        }

        if (value > balance) {
            revert Account__InsufficientFunds();
        }

        lock = true;
        if (block.timestamp < lastStartOfLockPeriod + lockPeriod) {
            uint256 fee = (balance * 3) / 100;

            balance -= fee;

            value -= fee;
            payable(admin).transfer(fee);
        }

        // update balance
        balance -= value;

        // reset account
        lastStartOfLockPeriod = block.timestamp;
        (bool success,) = payable(to).call{value: value}("");

        if (!success) {
            revert Account__WithdrawalFailed();
        }

        
        lock = false;
        emit Withdrawal(owner, to, value, savingsType);
    }

    /// @notice sends ERC20 token to required address
    function withdrawERC20(uint256 value, address to) external onlyOwner {
         if (lock) {
            revert Account__ReentrancyError();
        }
        if (to == address(0)) {
            revert Account__ZeroAddressError();
        }

        if (savingsType == Type.ETHER) {
            revert Account__InvalidAccountType();
        }

        if (value > balance) {
            revert Account__InsufficientFunds();
        }

        IERC20 tokenContract = IERC20(tokenAddress);

        lock = true;

        if (block.timestamp < lastStartOfLockPeriod + lockPeriod) {
            uint256 fee = (value * 3) / 100;

            balance -= fee;

            value -= fee;

            tokenContract.transfer(admin, fee);
        }

        balance -= value;

         // reset account
        lastStartOfLockPeriod = block.timestamp;

        tokenContract.transfer(to, value);

       lock = false;

        emit Withdrawal(owner, to, value, savingsType);
    }

    /// @notice get all user's balance
    function getBalance() external view onlyAdminAndOwner returns (uint256 balance_) {
        return balance;
    }
}
