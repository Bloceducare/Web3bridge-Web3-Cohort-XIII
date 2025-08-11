// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

interface IERC20 {
    function approve(address _spender, uint256 _value) external returns (bool);
    function balanceOf(address who) external view returns (uint256 balance);
    function transfer(address _to, uint256 _value) external returns (bool);
    function transferFrom(address _from, address _to, uint256 _value) external returns (bool);
}

contract Piggybank {
    // where withdrawal fees go
    address public factoryOwner; 

    struct SavingPlan {
        address owner;
        uint256 startTime;
        uint256 value;
        uint256 lockPeriod;
        address token;
        uint256 balance;
    }

    mapping(address => SavingPlan[]) public savings;

    // Factory sets its owner
    constructor(address _factoryOwner) {
        factoryOwner = _factoryOwner;
    }

    event DepositMade(address indexed user, uint256 amount, address token, uint256 lockPeriod);

    function deposit(uint256 _amount, address _token, uint256 _lockPeriod) external payable {
        require(_amount > 0, "Deposit amount should be greater than 0");
        require(_lockPeriod > 0, "Lock period should be more than 0");

        if (_token == address(0)) {
            require(msg.value == _amount, "Invalid ETH Amount");
        } else {
            require(msg.value == 0, "ETH not allowed for token deposit");
            require(IERC20(_token).transferFrom(msg.sender, address(this), _amount), "Token transfer failed");
        }

        savings[msg.sender].push(
            SavingPlan(msg.sender, block.timestamp, _amount, _lockPeriod, _token, _amount)
        );
         emit DepositMade(msg.sender, _amount, _token, _lockPeriod);
    }

    function withdraw(uint256 _planIndex) external {
        require(_planIndex < savings[msg.sender].length, "Invalid plan index");

        SavingPlan storage plan = savings[msg.sender][_planIndex];
        require(plan.balance > 0, "Already withdrawn");

        bool earlyWithdrawal = block.timestamp < (plan.startTime + plan.lockPeriod);
        uint256 amountToSend = plan.balance;

        if (earlyWithdrawal) {
            uint256 fee = (plan.balance * 3) / 100; // 3% fee
            amountToSend -= fee;

            // Send fee to factory owner
            if (plan.token == address(0)) {
                payable(factoryOwner).transfer(fee);
            } else {
                require(IERC20(plan.token).transfer(factoryOwner, fee), "Fee transfer failed");
            }
        }

        // Send funds to user
        if (plan.token == address(0)) {
            payable(msg.sender).transfer(amountToSend);
        } else {
            require(IERC20(plan.token).transfer(msg.sender, amountToSend), "Token withdrawal failed");
        }

        // Reset balance to prevent re-entrancy double-withdraw
        plan.balance = 0;
    }
}
