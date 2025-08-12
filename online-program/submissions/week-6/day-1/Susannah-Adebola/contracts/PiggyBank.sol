// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./IERC20.sol";
import "./IPiggyFactory.sol";

contract PiggyBank {
    enum SavingsChoice { Ethers, ERC20 }
    struct Plan {
        string name;
        string description;
        uint256 lockTime;
        uint256 amount;
        SavingsChoice choice;
    }

    address public owner;
    address public factory;
    mapping(address => uint256) public balances;
    mapping(address => Plan[]) public savingsPlans;
    Plan[] public Plans;

    // Mapping from planId to ERC20 token address (only for ERC20 plans)
    mapping(uint256 => address) public planTokenAddresses;

    event PlanCreated(address indexed user, Plan plan);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can make changes");
        _;
    }

    constructor(address _factory) {
        owner = msg.sender;
        factory = _factory;
    }

    function createSavingPlan(
        string memory _name,
        string memory _description,
        uint256 _lockTime,
        uint256 _amount,
        SavingsChoice _choice,
        address _tokenAddress
    ) external onlyOwner {
        require(_lockTime > 0, "Lock time must be greater than zero");
        uint256 unlockTime = block.timestamp + _lockTime;
        require(
            !IPiggyFactory(factory).isLockTimeUsed(owner, unlockTime),
            "You have already used this lock time"
        );
        IPiggyFactory(factory).markLockTimeUsed(owner, unlockTime);

        if (_choice == SavingsChoice.Ethers) {
            Plans.push(
                Plan(
                    _name,
                    _description,
                    _lockTime,
                    _amount,
                    _choice
                )
            );
        } else if (_choice == SavingsChoice.ERC20) {
            Plans.push(
                Plan(
                    _name,
                    _description,
                    _lockTime,
                    _amount,
                    _choice
                )
            );
            planTokenAddresses[Plans.length - 1] = _tokenAddress;
        } else {
            revert("You can only save in either ERC20 or Ethers");
        }
        emit PlanCreated(msg.sender, Plans[Plans.length - 1]);
    }

    function depositEther(uint256 planId) external payable onlyOwner {
        Plan storage plan = Plans[planId];
        require(plan.choice == SavingsChoice.Ethers, "Not Ether plan");
        plan.amount += msg.value;
    }

    function depositERC20(uint256 planId, uint256 amount) external onlyOwner {
        Plan storage plan = Plans[planId];
        require(plan.choice == SavingsChoice.ERC20, "Not ERC20 plan");
        address tokenAddr = planTokenAddresses[planId];
        require(tokenAddr != address(0), "Token address not set");
        IERC20(tokenAddr).transferFrom(msg.sender, address(this), amount);
        plan.amount += amount;
    }

    function getTotalBalances() external view returns (uint256 etherBalance, uint256 tokenBalance) {
        etherBalance = address(this).balance;
        for (uint256 i = 0; i < Plans.length; i++) {
            if (Plans[i].choice == SavingsChoice.ERC20) {
                address tokenAddr = planTokenAddresses[i];
                if (tokenAddr != address(0)) {
                    tokenBalance += IERC20(tokenAddr).balanceOf(address(this));
                }
            }
        }
    }

    function withdraw(uint256 planId) external onlyOwner {
        Plan storage plan = Plans[planId];
        uint256 amount = plan.amount;
        require(amount > 0, "No funds");

        if (block.timestamp < plan.lockTime) {
            uint256 fee = (amount * 3) / 100;
            amount -= fee;
            if (plan.choice == SavingsChoice.Ethers) {
                _transferFee(plan.choice, address(0), fee);
            } else {
                address tokenAddr = planTokenAddresses[planId];
                _transferFee(plan.choice, tokenAddr, fee);
            }
        }

        plan.amount = 0;

        if (plan.choice == SavingsChoice.Ethers) {
            payable(owner).transfer(amount);
        } else {
            address tokenAddr = planTokenAddresses[planId];
            IERC20(tokenAddr).transfer(owner, amount);
        }
    }

    function _transferFee(SavingsChoice choice, address _token, uint256 fee) internal {
        address admin = IPiggyFactory(factory).admin();
        if (choice == SavingsChoice.Ethers) {
            payable(admin).transfer(fee);
        } else {
            IERC20(_token).transfer(admin, fee);
        }
    }

    function getPlanCount() external view returns (uint256) {
        return Plans.length;
    }
    function getPlanNames() external view returns (string[] memory) {
        string[] memory names = new string[](Plans.length);
        for (uint256 i = 0; i < Plans.length; i++) {
            names[i] = Plans[i].name;
        }
        return names;
    }
}