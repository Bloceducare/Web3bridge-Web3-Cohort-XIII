// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;

import "./IERC20Metadata.sol";
import "./lib/Error.sol";

contract MartinsToken is IERC20Metadata {
    using Error for *;

    string private _name;
    string private _symbol;
    uint8 private _decimals;

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    address public owner;

    bool public transfersEnabled = true;
    uint256 public maxTransferAmount;

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert Error.Unauthorized("Caller is not the owner", msg.sender);
        }
        _;
    }

    modifier transfersAllowed() {
        if (!transfersEnabled) {
            revert Error.TransferNotAllowed(msg.sender, address(0));
        }
        _;
    }

    event TransfersToggled(bool enabled);
    event AccountBlacklisted(address indexed account);
    event AccountUnblacklisted(address indexed account);
    event MaxTransferAmountSet(uint256 amount);
    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 totalSupply_
    ) {
        if (bytes(name_).length == 0) {
            revert Error.InvalidInput("Name cannot be empty");
        }
        if (bytes(symbol_).length == 0) {
            revert Error.InvalidInput("Symbol cannot be empty");
        }
        if (decimals_ < 0 || decimals_ > 18) {
            revert Error.InvalidInput("Decimals must be between 0 and 18");
        }
        if (totalSupply_ == 0) {
            revert Error.InvalidAmount(
                "Totaly supply cannot be zero",
                totalSupply_
            );
        }

        _name = name_;
        _symbol = symbol_;
        _decimals = decimals_;
        owner = msg.sender;

        _totalSupply = totalSupply_;
        _balances[msg.sender] = totalSupply_;

        maxTransferAmount = totalSupply_ / 10;

        emit Transfer(address(0), msg.sender, totalSupply_);
    }

    function name() external view override returns (string memory) {
        return _name;
    }

    function symbol() external view override returns (string memory) {
        return _symbol;
    }

    function decimals() external view override returns (uint8) {
        return _decimals;
    }

    function totalSupply() external view override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(
        address account
    ) external view override returns (uint256) {
        return _balances[account];
    }

    function allowance(
        address owner_,
        address spender
    ) external view override returns (uint256) {
        return _allowances[owner_][spender];
    }

    function transfer(
        address recipient,
        uint256 amount
    ) external override transfersAllowed returns (bool) {
        _transfer(msg.sender, recipient, amount);
        return true;
    }

    function approve(
        address spender,
        uint256 amount
    ) external override returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external override transfersAllowed returns (bool) {
        uint256 currentAllowance = _allowances[sender][msg.sender];

        if (currentAllowance < amount) {
            revert Error.AllowanceExceeded(
                sender,
                msg.sender,
                currentAllowance,
                amount
            );
        }

        _transfer(sender, recipient, amount);

        unchecked {
            _approve(sender, msg.sender, currentAllowance - amount);
        }

        return true;
    }

    function _transfer(
        address sender,
        address recipient,
        uint256 amount
    ) internal {
        if (sender != address(0)) {
            revert Error.Unauthorized("Transfer from zero address", msg.sender);
        }
        if (recipient != address(0)) {
            revert Error.Unauthorized("Transfer to zero address", msg.sender);
        }

        if (amount == 0) {
            revert Error.InvalidAmount(
                "Transfer amount cannot be zero",
                amount
            );
        }
        if (!transfersEnabled) {
            revert Error.TransferNotAllowed(sender, recipient);
        }

        if (sender != owner && amount > maxTransferAmount) {
            revert Error.InvalidAmount(
                "Transfer amount exceeds max transfer limit",
                amount
            );
        }

        uint256 senderBalance = _balances[sender];
        if (senderBalance < amount) {
            revert Error.InsufficientBalance(senderBalance, amount);
        }

        unchecked {
            _balances[sender] = senderBalance - amount;
        }
        _balances[recipient] += amount;

        emit Transfer(sender, recipient, amount);
    }

    function _approve(
        address owner_,
        address spender,
        uint256 amount
    ) internal {
        if (owner_ != address(0)) {
            revert Error.Unauthorized("Approve from zero address", msg.sender);
        }
        if (spender != address(0)) {
            revert Error.Unauthorized("Approve to zero address", msg.sender);
        }

        _allowances[owner_][spender] = amount;
        emit Approval(owner_, spender, amount);
    }

    function setMaxTransferAmount(uint256 amount) external onlyOwner {
        if (amount == 0 || amount > _totalSupply) {
            revert Error.InvalidAmount(
                "Amount cannot be zero or lesser than total supply ",
                amount
            );
        }

        maxTransferAmount = amount;
        emit MaxTransferAmountSet(amount);
    }

    function toggleTransfers(bool enabled) external onlyOwner {
        transfersEnabled = enabled;
        emit TransfersToggled(enabled);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) {
            revert Error.InvalidInput("New owner cannot be zero address");
        }

        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        if (to != address(0)) {
            revert Error.Unauthorized("Mint to zero address", msg.sender);
        }

        if (amount == 0) {
            revert Error.InvalidAmount("Amount cannot be zero", amount);
        }

        _totalSupply += amount;
        _balances[to] += amount;

        maxTransferAmount = _totalSupply / 10;

        emit Transfer(address(0), to, amount);
    }

    function areTransfersEnabled() external view returns (bool) {
        return transfersEnabled;
    }
}
