// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IPiggyBank.sol";

/**
 * @title PiggyBank
 * @dev Individual savings contract. Supports ETH/ERC20 with lock periods and fees.
 */
contract PiggyBank is IPiggyBank {
    using SafeERC20 for IERC20;

    address public immutable owner; // User owner
    uint256 public immutable lockPeriod; // Lock in seconds
    address public immutable admin; // Factory admin for fees
    uint256 public lastDepositTime; // Timestamp of last deposit

    // Token/ETH balances (address(0) for ETH)
    mapping(address => uint256) public balances;

    event Deposited(address indexed token, uint256 amount);
    event Withdrawn(address indexed token, uint256 amount, bool early, uint256 fee);

    constructor(address _owner, uint256 _lockPeriod, address _admin) {
        require(_owner != address(0), "Invalid owner");
        require(_admin != address(0), "Invalid admin");
        owner = _owner;
        lockPeriod = _lockPeriod;
        admin = _admin;
    }

    /**
     * @dev Deposit ETH or ERC20.
     * @param token Token address (address(0) for ETH).
     * @param amount Amount to deposit.
     */
    function deposit(address token, uint256 amount) external payable override {
        require(msg.sender == owner, "Only owner");
        require(amount > 0, "Amount > 0");

        // Effects
        balances[token] += amount;
        lastDepositTime = block.timestamp;

        // Interactions
        if (token == address(0)) {
            require(msg.value == amount, "ETH value mismatch");
        } else {
            require(msg.value == 0, "No ETH for token");
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        }

        emit Deposited(token, amount);
    }

    /**
     * @dev Withdraw from the piggy bank.
     * @param token Token address (address(0) for ETH).
     * @param amount Amount to withdraw.
     */
    function withdraw(address token, uint256 amount) external override {
        require(msg.sender == owner, "Only owner");
        require(amount > 0 && amount <= balances[token], "Invalid amount");

        // Checks
        bool isEarly = block.timestamp < lastDepositTime + lockPeriod;
        uint256 fee = isEarly ? (amount * 3) / 100 : 0;
        uint256 netAmount = amount - fee;

        // Effects (update state before interaction)
        balances[token] -= amount;

        // Interactions
        if (token == address(0)) {
            (bool sentOwner, ) = payable(owner).call{value: netAmount}("");
            require(sentOwner, "ETH transfer failed");

            if (fee > 0) {
                (bool sentAdmin, ) = payable(admin).call{value: fee}("");
                require(sentAdmin, "Fee transfer failed");
            }
        } else {
            IERC20(token).safeTransfer(owner, netAmount);
            if (fee > 0) {
                IERC20(token).safeTransfer(admin, fee);
            }
        }

        emit Withdrawn(token, amount, isEarly, fee);
    }

    /**
     * @dev Get balance for a token/ETH.
     * @param token Token address (address(0) for ETH).
     * @return Balance.
     */
    function getBalance(address token) external view override returns (uint256) {
        return balances[token];
    }
}
