// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IPiggyBankFactory.sol";

error NOT_OWNER();
error NOT_FACTORY();
error AMOUNT_MUST_BE_GREATER_THAN_ZERO();
error LOCK_PERIOD_MUST_BE_GREATER_THAN_ZERO();
error INVALID_TOKEN_ADDRESS();
error TRANSFER_FAILED();
error NO_FUNDS_TO_WITHDRAW();
error PLAN_NOT_ACTIVE();
error NO_PENALTIES_TO_WITHDRAW();
error NO_PIGGY_BANK_FOUND();
error ONLY_PIGGY_BANK_CAN_CALL();
error PLAN_CANNOT_BE_FOUND();
error PIGGY_BANK_ALREADY_EXISTS();


contract PiggyBank{
    using SafeERC20 for IERC20;

    struct SavingsPlan{
        uint128 amount;
        uint64 lockPeriod;
        uint64 startTime;
        address token;
        bool isActive;
        uint planID;
    }

    address public factory;
    address public owner;
    uint public nextPlanID;

    mapping (uint => SavingsPlan) public savingsPlans;
    uint[] public planIDs;

    event SavingsPlanCreated(uint indexed _planID, uint _amount, uint _lockPeriod, address _token);
    event Withrawal(uint indexed _planID, uint _amount, uint _penalty, bool _earlyWIthdrawal);


    constructor(address _owner, address _factory){
        owner = _owner;
        factory = _factory;
        nextPlanID = 1;
    } 


    modifier onlyOwner(){
        if(msg.sender != owner) revert NOT_OWNER();
        _;
    }

    modifier onlyFactory(){
        if(msg.sender != factory) revert NOT_FACTORY();
        _;
    }

    
    
    function createETHSavingsPlan(uint64 _lockPeriod) external payable onlyOwner{
        if(msg.value == 0) revert AMOUNT_MUST_BE_GREATER_THAN_ZERO();
        if(_lockPeriod == 0) revert LOCK_PERIOD_MUST_BE_GREATER_THAN_ZERO();

        uint planID = nextPlanID;

        savingsPlans[planID] = SavingsPlan({amount: uint128(msg.value), lockPeriod: _lockPeriod, startTime: uint64(block.timestamp), token: address(0), isActive: true, planID: planID});

        planIDs.push(planID);
        nextPlanID++; //consider coming back to this honestly though coz copilot autocomplete cause am :)

        emit SavingsPlanCreated(planID, msg.value, _lockPeriod, address(0));

    }

    function withdrawSavings(uint _planID) external onlyOwner {
        SavingsPlan storage plan = savingsPlans[_planID];

        if (!plan.isActive) revert PLAN_NOT_ACTIVE();
        if(plan.amount == 0) revert NO_FUNDS_TO_WITHDRAW();

        uint penalty = 0;
        bool earlyWithdrawal = false;

        if(block.timestamp < plan.startTime + plan.lockPeriod){
            earlyWithdrawal = true;
            penalty = (plan.amount * 3)/100; //omo this maths is getting interesting, this is just a 3% penalty fee for early withdrawal

        }

        uint withdrawAmount = plan.amount - penalty; //which of-course will still be the same plan.amount

        plan.isActive = false;
        plan.amount = 0; //this just basically update the state before sending the funds to prevent RENETRANCY Attack, because if it sends the funds before updating, then omo, IZ-GONE

        if (plan.token == address(0)){
            if(penalty > 0){
                (bool sent, ) = payable(factory).call{value: penalty}("");
                    if(!sent) revert TRANSFER_FAILED();
                    IPiggyBankFactory(factory).logPenalty(address(0), penalty); 
                
            }
            (bool success, ) = payable (owner).call{value: withdrawAmount}("");
            if (!success) revert TRANSFER_FAILED();

        } else {
            IERC20 token = IERC20(plan.token);
            if (penalty > 0){
                token.safeTransfer(factory, penalty);
                IPiggyBankFactory(factory).logPenalty(plan.token, penalty);
            }

            token.safeTransfer(owner, withdrawAmount);
        }

        emit Withrawal(_planID, withdrawAmount, penalty, earlyWithdrawal);

    }

    
    function getAllSavingsPlans() external view returns(SavingsPlan[] memory){
        SavingsPlan[] memory plans = new SavingsPlan[](planIDs.length);
        for (uint i; i < planIDs.length; i++){
            plans[i] = savingsPlans[planIDs[i]];
        }
        return plans;
    }

    function getActivePlansCount() external view returns(uint){
        uint count;
        for (uint i; i <  planIDs.length; i++){
            if (savingsPlans[planIDs[i]].isActive){
                count++;
            }
        } return count;
    }

    function getTokenBalance(address _token) external view returns(uint){
        uint totalBalance;
        for(uint i; i < planIDs.length; i++){
            SavingsPlan memory plan = savingsPlans[planIDs[i]];
            if (plan.isActive && plan.token == _token){
                totalBalance += plan.amount;
            }
        }
        return totalBalance;
    }

    function canWithdrawWithoutPenalty(uint _planID) external view returns (bool){
        SavingsPlan memory plan = savingsPlans[_planID];
        return block.timestamp >= plan.startTime + plan.lockPeriod;
    }

    function getTimeRemaining(uint _planID) external view returns (uint){
        SavingsPlan memory plan = savingsPlans[_planID];
        if (!plan.isActive) revert PLAN_NOT_ACTIVE();
        if (block.timestamp >= plan.startTime + plan.lockPeriod) return 0;
        return (plan.startTime + plan.lockPeriod) - block.timestamp;
    }


}