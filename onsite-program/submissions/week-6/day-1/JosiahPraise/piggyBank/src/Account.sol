// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Type} from "./lib.sol";
import {IERC20} from "./IERC20.sol";

contract Account {

    address public immutable owner;
    address public immutable admin;
    address public immutable tokenAddress; // The ERC20 token for this account, if applicable
    Type public immutable savingsType;

    uint256 public balance;
    uint256 public lockPeriod; // The duration of the lock in seconds
    uint256 public lockEndsAt; // The timestamp when the current lock period ends

    bool internal locked; // Reentrancy guard

    error Account__UnAuthorized();
    error Account__InvalidAccountType(Type actualType, Type expectedType);
    error Account__InvalidTokenAddress();
    error Account__DepositFailed();
    error Account__WithdrawalFailed();
    error Account__InsufficientFunds(uint256 balance, uint256 amountToWithdraw);
    error Account__ZeroAddressNotAllowed();
    error Account__Reentrancy();

    event Deposit(address indexed depositor, uint256 amount);
    event Withdrawal(address indexed withdrawer, address indexed to, uint256 amount, uint256 fee);

    modifier onlyOwner() {
        if (msg.sender != owner) revert Account__UnAuthorized();
        _;
    }

    modifier onlyAdminOrOwner() {
        if (msg.sender != owner && msg.sender != admin) revert Account__UnAuthorized();
        _;
    }

    modifier nonReentrant() {
        if (locked) revert Account__Reentrancy();
        locked = true;
        _;
        locked = false;
    }

    constructor(
        address _admin,
        address _owner,
        uint256 _lockPeriodInSeconds,
        Type _accountType,
        address _erc20Address
    ) {
        if (_owner == address(0) || _admin == address(0)) {
            revert Account__ZeroAddressNotAllowed();
        }
        if (_accountType == Type.ERC20 && _erc20Address == address(0)) {
            revert Account__InvalidTokenAddress();
        }

        owner = _owner;
        admin = _admin;
        lockPeriod = _lockPeriodInSeconds;
        savingsType = _accountType;
        tokenAddress = _erc20Address;
        lockEndsAt = block.timestamp + lockPeriod;
    }

    /// @notice Allows the owner to deposit ETH into this ETH-based savings account.
    function depositEth() external payable onlyOwner {
        if (savingsType != Type.ETHER) {
            revert Account__InvalidAccountType(savingsType, Type.ETHER);
        }
        balance += msg.value;
        emit Deposit(owner, msg.value);
    }

    /// @notice Allows the owner to deposit a pre-approved amount of ERC20 tokens.
    function depositERC20(uint256 amount) external onlyOwner {
        if (savingsType != Type.ERC20) {
            revert Account__InvalidAccountType(savingsType, Type.ERC20);
        }
        if (amount == 0) return;

        IERC20 token = IERC20(tokenAddress);
        bool success = token.transferFrom(owner, address(this), amount);
        if (!success) revert Account__DepositFailed();

        balance += amount;
        emit Deposit(owner, amount);
    }

    /// @notice Allows the owner to withdraw ETH. Charges a 3% fee if before the lock period ends.
    function withdrawETH(uint256 amount, address to) external onlyOwner nonReentrant {
        if (savingsType != Type.ETHER) revert Account__InvalidAccountType(savingsType, Type.ETHER);
        if (to == address(0)) revert Account__ZeroAddressNotAllowed();
        if (amount > balance) revert Account__InsufficientFunds(balance, amount);

        uint256 fee = 0;
        // Check if the withdrawal is happening BEFORE the lock period is over
        if (block.timestamp < lockEndsAt) {
            fee = (amount * 3) / 100;
        }

        uint256 amountToSend = amount - fee;

     
        balance -= amount; 

       
        if (fee > 0) {
            (bool successFee, ) = payable(admin).call{value: fee}("");
            if (!successFee) revert Account__WithdrawalFailed();
        }
        
        
        (bool successSend, ) = payable(to).call{value: amountToSend}("");
        if (!successSend) revert Account__WithdrawalFailed();

       
        lockEndsAt = block.timestamp + lockPeriod;
        emit Withdrawal(owner, to, amountToSend, fee);
    }

    /// @notice Allows the owner to withdraw ERC20 tokens. Charges a 3% fee if before the lock period ends.
    function withdrawERC20(uint256 amount, address to) external onlyOwner nonReentrant {
        if (savingsType != Type.ERC20) revert Account__InvalidAccountType(savingsType, Type.ETHER);
        if (to == address(0)) revert Account__ZeroAddressNotAllowed();
        if (amount > balance) revert Account__InsufficientFunds(balance, amount);
        
        IERC20 token = IERC20(tokenAddress);
        uint256 fee = 0;
        // Check if the withdrawal is happening before the lock period is over
        if (block.timestamp < lockEndsAt) {
            fee = (amount * 3) / 100;
        }

        uint256 amountToSend = amount - fee;
        
        balance -= amount;

        if (fee > 0) {
            token.transfer(admin, fee);
        }
        token.transfer(to, amountToSend);

        // Reset the lock period
        lockEndsAt = block.timestamp + lockPeriod;
        emit Withdrawal(owner, to, amountToSend, fee);
    }
    
    /// @notice Gets the balance of this account. Can only be called by the owner or admin.
    function getBalance() external view onlyAdminOrOwner returns (uint256) {
        return balance;
    }
}