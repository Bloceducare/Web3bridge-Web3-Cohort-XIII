// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IPeggyIERC20.sol";

/// @title PiggyBank (Child Contract)
/// @notice Represents a single savings account for a user.
///         Supports saving ETH or ERC20 tokens.
///         Funds are locked for a specific period.
///         Early withdrawal charges a 3% fee sent to the Factory's admin.
contract PiggyBank {
    address public owner;         // Account holder (saver)
    address public token;         // address(0) means ETH, otherwise ERC20 token address
    uint256 public lockPeriod;    // Lock duration in seconds
    uint256 public unlockTime;    // Timestamp when funds can be withdrawn without penalty
    address public factoryAdmin;  // Address that receives early withdrawal fees

    uint256 private balanceToken; // Internal tracker for ERC20 deposits
    // For ETH, we simply check address(this).balance

    /// @dev Emitted when funds are deposited
    event Deposited(address indexed from, uint256 amount);
    /// @dev Emitted when funds are withdrawn without penalty
    event Withdrawn(address indexed to, uint256 amount);
    /// @dev Emitted when funds are withdrawn early (with fee)
    event EarlyWithdrawn(address indexed to, uint256 amountAfterFee, uint256 fee);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    /// @notice Deploys a new PiggyBank
    /// @param _owner The address of the account holder
    /// @param _token The ERC20 token address (or address(0) for ETH)
    /// @param _lockPeriod Duration of lock in seconds
    /// @param _factoryAdmin Address of the factory admin (receives early withdrawal fees)
    constructor(address _owner, address _token, uint256 _lockPeriod, address _factoryAdmin) {
        require(_owner != address(0), "Invalid owner");
        require(_factoryAdmin != address(0), "Invalid admin");

        owner = _owner;
        token = _token;
        lockPeriod = _lockPeriod;
        factoryAdmin = _factoryAdmin;
        unlockTime = 0; // Will be set on first deposit
    }

    /// @notice Deposit ETH into the piggy bank
    function depositETH() external payable onlyOwner {
        require(token == address(0), "Not an ETH piggy");
        require(msg.value > 0, "Zero deposit");

        // Set unlock time on every deposit
        unlockTime = block.timestamp + lockPeriod;

        emit Deposited(msg.sender, msg.value);
    }

    /// @notice Deposit ERC20 tokens into the piggy bank
    /// @param amount The number of tokens to deposit (must be approved first)
    function depositToken(uint256 amount) external onlyOwner {
        require(token != address(0), "Not an ERC20 piggy");
        require(amount > 0, "Zero deposit");

        bool ok = IPeggyIERC20(token).transferFrom(msg.sender, address(this), amount);
        require(ok, "Token transfer failed");

        balanceToken += amount;
        unlockTime = block.timestamp + lockPeriod;

        emit Deposited(msg.sender, amount);
    }

    /// @notice Withdraw funds from the piggy bank
    ///         If withdrawn before unlockTime, a 3% fee is charged and sent to the factory admin.
    function withdraw() external onlyOwner {
        if (token == address(0)) {
            // ETH Withdrawal
            uint256 bal = address(this).balance;
            require(bal > 0, "No funds");

            if (block.timestamp >= unlockTime) {
                // No penalty
                (bool sent, ) = owner.call{value: bal}("");
                require(sent, "ETH transfer failed");
                emit Withdrawn(owner, bal);
            } else {
                // Early withdrawal with 3% fee
                uint256 fee = (bal * 3) / 100;
                uint256 afterBalance = bal - fee;

                (bool feeSent, ) = factoryAdmin.call{value: fee}("");
                require(feeSent, "Fee transfer failed");

                (bool ownerSent, ) = owner.call{value: afterBalance}("");
                require(ownerSent, "Owner transfer failed");

                emit EarlyWithdrawn(owner, afterBalance, fee);
            }
        } else {
            // ERC20 Withdrawal
            uint256 bal = balanceToken;
            require(bal > 0, "No funds");

            if (block.timestamp >= unlockTime) {
                // No penalty
                bool ok = IPeggyIERC20(token).transfer(owner, bal);
                require(ok, "Token transfer failed");
                balanceToken = 0;
                emit Withdrawn(owner, bal);
            } else {
                // Early withdrawal with 3% fee
                uint256 fee = (bal * 3) / 100;
                uint256 afterBalance = bal - fee;

                bool feeOk = IPeggyIERC20(token).transfer(factoryAdmin, fee);
                require(feeOk, "Fee transfer failed");

                bool ownerOk = IPeggyIERC20(token).transfer(owner, afterBalance);
                require(ownerOk, "Owner transfer failed");

                balanceToken = 0;
                emit EarlyWithdrawn(owner, afterBalance, fee);
            }
        }
    }

    /// @notice Get the current balance in this piggy bank
    function getBalance() external view returns (uint256) {
        if (token == address(0)) return address(this).balance;
        return balanceToken;
    }

    /// @notice Get the unlock time
    function getUnlockTime() external view returns (uint256) {
        return unlockTime;
    }
}
