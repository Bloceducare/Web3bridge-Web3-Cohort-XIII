// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./interfaces/IPiggyBank.sol";
import "./errors/PiggyErrors.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PiggyBankSaving is IPiggyBank {
    address public immutable owner;
    address public immutable factoryAdmin;
    uint256 public immutable lockEnd;
    bool public immutable isERC20;
    address public immutable token;

    uint256 public depositedAmount;

    event Deposited(address indexed user, uint256 amount, bool isERC20);
    event Withdrawn(address indexed user, uint256 amount, bool isERC20, bool earlyWithdrawal, uint256 penalty);

    constructor(address _owner, uint256 _lockDuration, bool _isERC20, address _token, address _factoryAdmin) {
        owner = _owner;
        lockEnd = block.timestamp + _lockDuration;
        isERC20 = _isERC20;
        token = _token;
        factoryAdmin = _factoryAdmin;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotVaultOwner();
        _;
    }

    function deposit(uint256 amount) external payable onlyOwner {
        if (!isERC20) {
            if (msg.value != amount) revert MismatchedDepositAmount();
            depositedAmount += amount;
        } else {
            if (amount == 0) revert ZeroDeposit();
            IERC20(token).transferFrom(msg.sender, address(this), amount);
            depositedAmount += amount;
        }

        emit Deposited(msg.sender, amount, isERC20);
    }

    function withdraw() external onlyOwner {
        if (depositedAmount == 0) {
            revert InsufficientBalance();
        }

        uint256 penaltyFee = 0;
        uint256 defaultedPayout = depositedAmount;
        bool early = false;

        if (block.timestamp < lockEnd) {
            penaltyFee = (depositedAmount * 3) / 100;

            defaultedPayout = depositedAmount - penaltyFee;
            early = true;

            emit Withdrawn(msg.sender, defaultedPayout, isERC20, early, penaltyFee);

            if (isERC20) {
                IERC20(token).transfer(factoryAdmin, penaltyFee);
                IERC20(token).transfer(owner, defaultedPayout);
            } else {
                payable(factoryAdmin).transfer(penaltyFee);
                payable(owner).transfer(defaultedPayout);
            }
        } else {
            if (isERC20) {
                IERC20(token).transfer(owner, depositedAmount);
            } else {
                payable(owner).transfer(depositedAmount);
            }
        }

        emit Withdrawn(msg.sender, depositedAmount, isERC20, early, penaltyFee);

        depositedAmount = 0;
    }

    function getPiggyVaultBalance() external view returns (uint256) {
        return depositedAmount;
    }

    function getLockEnd() external view returns (uint256) {
        return lockEnd;
    }
}