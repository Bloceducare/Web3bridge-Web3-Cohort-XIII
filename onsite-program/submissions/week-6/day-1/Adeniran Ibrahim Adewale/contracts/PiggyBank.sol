// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "./interfaces/IPiggyBank.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./messages/Error.sol";

contract PiggyBank is IPiggyBank {
    address public owner;
    address public factory;
    address public admin;

    SavingsPlan[] public plans;

    struct SavingsPlan {  
        uint256 amount;
        address token;
        AssetType assetType;
        uint256 unlockTime;
        uint256 lockPeriod; 
        bool withdrawn; 
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not your PiggyBank");
        _;
    }

    constructor(address _owner, address _admin, address _factory) {
        owner = _owner;
        admin = _admin;
        factory = _factory;
    }

    function saveETH(uint256 _lockPeriod) external payable onlyOwner {
        if (msg.value == 0) {
            revert Error.ETH_TOO_LOW();
        }
        plans.push(
            SavingsPlan({
                amount: msg.value,
                token: address(0),
                assetType: AssetType.ETH,
                unlockTime: block.timestamp + _lockPeriod,
                lockPeriod: _lockPeriod,
                withdrawn: false
            })
        );
    }

    function saveERC20(address _token, uint256 _amount, uint256 _lockPeriod) external onlyOwner {
        if (_amount == 0) {
            revert Error.ENTER_CORRECT_AMOUNT();
        }
        IERC20(_token).transferFrom(msg.sender, address(this), _amount);

        plans.push(
            SavingsPlan({
                amount: _amount,
                token: _token,
                assetType: AssetType.ERC20,
                unlockTime: block.timestamp + _lockPeriod,
                lockPeriod: _lockPeriod,
                withdrawn: false
            })
        );
    }

    function withdraw(uint256 _planId) external onlyOwner {
        require(_planId < plans.length, "Plan does not exist");

        SavingsPlan storage plan = plans[_planId];
        require(!plan.withdrawn, "Already withdrawn");

        uint256 amountToSend = plan.amount;

        if (block.timestamp < plan.unlockTime) {
            uint256 fee = (plan.amount * 3) / 100;
            amountToSend -= fee;

            if (plan.assetType == AssetType.ETH) {
                payable(factory).transfer(fee);
            } else {
                IERC20(plan.token).transfer(factory, fee);
            }
        }

        plan.withdrawn = true;

        if (plan.assetType == AssetType.ETH) {
            payable(owner).transfer(amountToSend);
        } else {
            IERC20(plan.token).transfer(owner, amountToSend);
        }
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getERC20Balance(address _token) external view returns (uint256) {
        return IERC20(_token).balanceOf(address(this));
    }

    function getPlan(uint256 _planId) 
        external 
        view 
        returns (
            uint256 amount,
            address token,
            AssetType assetType,
            uint256 unlockTime,
            uint256 lockPeriod,
            bool withdrawn
        ) 
    {
        require(_planId < plans.length, "Plan does not exist");
        SavingsPlan memory plan = plans[_planId];
        return (
            plan.amount,
            plan.token,
            plan.assetType,
            plan.unlockTime,
            plan.lockPeriod,
            plan.withdrawn
        );
    }

    receive() external payable {}
}
