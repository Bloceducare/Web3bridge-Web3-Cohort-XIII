//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract PiggyBank  {
    using SafeERC20 for IERC20;
    address public factoryAdmin;

    enum Status {
        Open,
        Locked,
        Withdrawn
    }

    string public name;
    address public owner;
    address public token;
    uint256 public amountSaved;
    uint256 public lockPeriod;
    uint256 public startTime;
    Status public status;

    event DepositedAndLocked(
        address indexed who,
        uint256 amount,
        uint256 lockPeriod
    );
    event Withdrawn(
        address indexed who,
        uint256 payout,
        uint256 fee,
        bool early
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "PiggyBank: not owner");
        _;
    }

    constructor(
        address _owner,
        address _factoryAdmin,
        string memory _name,
        address _token
    ) {
        require(_owner != address(0), "PiggyBank: bad owner");
        require(_factoryAdmin != address(0), "PiggyBank: bad admin");
        owner = _owner;
        factoryAdmin = _factoryAdmin;
        name = _name;
        token = _token;
        status = Status.Open;
    }

    function depositAndLock(
        uint256 _amount,
        uint256 _lockPeriod
    ) external payable onlyOwner {
        require(status == Status.Open, "PiggyBank: not open");
        require(_lockPeriod > 0, "PiggyBank: lockPeriod > 0");

        uint256 depositAmount;
        if (token == address(0)) {
            // ETH
            require(msg.value > 0, "PiggyBank: send ETH");
            depositAmount = msg.value;
        } else {
            require(_amount > 0, "PiggyBank: token amount > 0");
            IERC20(token).safeTransferFrom(msg.sender, address(this), _amount);
            depositAmount = _amount;
        }
        amountSaved += depositAmount;
        lockPeriod = _lockPeriod;
        startTime = block.timestamp;
        status = Status.Locked;

        emit DepositedAndLocked(msg.sender, depositAmount, _lockPeriod);
    }

    function withdraw() external  onlyOwner {
        require(status == Status.Locked, "PiggyBank: not locked");
        uint256 amount = amountSaved;
        require(amount > 0, "PiggyBank: nothing to withdraw");

        bool isUnlocked = block.timestamp >= startTime + lockPeriod;
        amountSaved = 0;
        status = Status.Withdrawn;

        if (isUnlocked) {
            if (token == address(0)) {
                _safeSendETH(owner, amount);
                emit Withdrawn(owner, amount, 0, false);
            } else {
                IERC20(token).safeTransfer(owner, amount);
                emit Withdrawn(owner, amount, 0, false);
            }
        } else {
            uint256 fee = (amount * 3) / 100;
            uint256 payout = amount - fee;

            if (token == address(0)) {
                _safeSendETH(factoryAdmin, fee);
                _safeSendETH(owner, payout);
            } else {
                IERC20(token).safeTransfer(factoryAdmin, fee);
                IERC20(token).safeTransfer(owner, payout);
            }
            emit Withdrawn(owner, payout, fee, true);
        }
    }

    function getBalance() external view returns (uint256) {
        if (token == address(0)) return address(this).balance;
        return IERC20(token).balanceOf(address(this));
    }

    function _safeSendETH(address to, uint256 amount) internal {
        (bool ok, ) = payable(to).call{value: amount}("");
        require(ok, "PiggyBank: ETH send failed");
    }

    receive() external payable {}
}
