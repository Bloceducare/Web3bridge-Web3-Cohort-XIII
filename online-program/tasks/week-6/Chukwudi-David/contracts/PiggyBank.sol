// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract PiggyBank {
    using SafeERC20 for IERC20;
    using Address for address payable;

    uint256 public constant BREAKING_FEE_BPS = 300;
    uint256 public constant BPS_DENOMINATOR = 10_000;

    address public immutable saver;
    uint256 public immutable lockPeriod;
    uint256 public immutable createdAt;
    address public immutable factory;

    uint256 private _ethBalance;

    address[] private _savedTokens;
    mapping(address => bool) private _tokenExists;

    event Deposit(address indexed from, address indexed token, uint256 amount);
    event Withdraw(address indexed to, address indexed token, uint256 amount, uint256 fee);

    modifier onlySaver() {
        require(msg.sender == saver, "Only saver");
        _;
    }

    constructor(address _saver, uint256 _lockPeriod, address _factory) {
        require(_saver != address(0), "Saver address cannot be zero");
        require(_lockPeriod > 0, "Lock period must be > 0");

        saver = _saver;
        lockPeriod = _lockPeriod;
        createdAt = block.timestamp;
        factory = _factory;
    }

    function depositETH() external payable {
        require(msg.value > 0, "Zero amount");
        _ethBalance += msg.value;
        _addToken(address(0)); // Track ETH as token
        emit Deposit(msg.sender, address(0), msg.value);
    }

    function depositERC20(address token, uint256 amount) external {
        require(amount > 0, "Zero amount");
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        _addToken(token);
        emit Deposit(msg.sender, token, amount);
    }

    function balanceOf(address token) public view returns (uint256) {
        return token == address(0) ? _ethBalance : IERC20(token).balanceOf(address(this));
    }

    function isLocked() public view returns (bool) {
        return block.timestamp < createdAt + lockPeriod;
    }

    function getSavedTokens() external view returns (address[] memory) {
        return _savedTokens;
    }

    function withdraw(address token, uint256 amount) external onlySaver {
        require(amount > 0, "Zero amount");
        uint256 bal = balanceOf(token);
        require(amount <= bal, "Insufficient balance");

        uint256 fee = isLocked() ? (amount * BREAKING_FEE_BPS) / BPS_DENOMINATOR : 0;
        uint256 toUser = amount - fee;

        if (token == address(0)) {
            _ethBalance -= amount;
            if (fee > 0) payable(factory).sendValue(fee);
            payable(saver).sendValue(toUser);
        } else {
            if (fee > 0) IERC20(token).safeTransfer(factory, fee);
            IERC20(token).safeTransfer(saver, toUser);
        }

        emit Withdraw(saver, token, toUser, fee);
    }

    function withdrawAllAfterLock(address token) external onlySaver {
        require(!isLocked(), "Still locked");
        uint256 amount = balanceOf(token);
        require(amount > 0, "No balance");

        if (token == address(0)) {
            _ethBalance = 0;
            payable(saver).sendValue(amount);
        } else {
            IERC20(token).safeTransfer(saver, amount);
        }

        emit Withdraw(saver, token, amount, 0);
    }

    function _addToken(address token) internal {
        if (!_tokenExists[token]) {
            _tokenExists[token] = true;
            _savedTokens.push(token);
        }
    }

    receive() external payable {
        _ethBalance += msg.value;
        _addToken(address(0));
        emit Deposit(msg.sender, address(0), msg.value);
    }
}
