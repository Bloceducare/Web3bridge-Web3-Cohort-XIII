// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";


contract PiggyBank is ReentrancyGuard {
    using SafeERC20 for IERC20;
    using Address for address payable;

    address public immutable saver;
    uint256 public immutable lockPeriod;
    uint256 public immutable createdAt;
    address public immutable factory;

    mapping(address => uint256) private _erc20Balances;
    uint256 private _ethBalance;

    event Deposit(address indexed from, address indexed token, uint256 amount);
    event Withdraw(address indexed to, address indexed token, uint256 amount, uint256 fee);

    modifier onlySaver() {
        require(msg.sender == saver, "only saver");
        _;
    }

    constructor(address _saver, uint256 _lockPeriod, address _factory) {
        require(_saver != address(0), "saver 0");
        saver = _saver;
        lockPeriod = _lockPeriod;
        createdAt = block.timestamp;
        factory = _factory;
    }

    function depositETH() external payable nonReentrant {
        require(msg.value > 0, "zero amount");
        _ethBalance += msg.value;
        emit Deposit(msg.sender, address(0), msg.value);
    }

    function depositERC20(address token, uint256 amount) external nonReentrant {
        require(amount > 0, "zero amount");
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        _erc20Balances[token] += amount;
        emit Deposit(msg.sender, token, amount);
    }

    function balanceOf(address token) public view returns (uint256) {
        if (token == address(0)) return _ethBalance;
        return _erc20Balances[token];
    }

    function isLocked() public view returns (bool) {
        return block.timestamp < createdAt + lockPeriod;
    }

    function withdraw(address token, uint256 amount) external nonReentrant onlySaver {
        require(amount > 0, "zero amount");
        uint256 bal = balanceOf(token);
        require(amount <= bal, "insufficient balance");

        bool locked = isLocked();
        uint256 fee = 0;

        if (locked) {
            fee = (amount * PiggyBankFactory(factory).BREAKING_FEE_BPS()) / PiggyBankFactory.BPS_DENOMINATOR();
        }

        uint256 toUser = amount - fee;
        if (token == address(0)) {
            _ethBalance -= amount;
            if (fee > 0) payable(PiggyBankFactory(factory).owner()).sendValue(fee);
            payable(saver).sendValue(toUser);
        } else {
            _erc20Balances[token] -= amount;
            if (fee > 0) IERC20(token).safeTransfer(PiggyBankFactory(factory).owner(), fee);
            IERC20(token).safeTransfer(saver, toUser);
        }

        emit Withdraw(saver, token, toUser, fee);
    }

    function withdrawAllAfterLock(address token) external nonReentrant onlySaver {
        require(!isLocked(), "still locked");
        uint256 amount = balanceOf(token);
        require(amount > 0, "no balance");

        if (token == address(0)) {
            _ethBalance = 0;
            payable(saver).sendValue(amount);
        } else {
            _erc20Balances[token] = 0;
            IERC20(token).safeTransfer(saver, amount);
        }

        emit Withdraw(saver, token, amount, 0);
    }

    receive() external payable {
        _ethBalance += msg.value;
        emit Deposit(msg.sender, address(0), msg.value);
    }
}