// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "./Token.sol";
import "./interfaces/IPiggyBank.sol";
error CAN_NOT_LOCK_ZERO_VALUE();
error  INSUFFICIENT_BALANCE();
error INSUFFICENT_ALLOWANCE();
error  AMOUNT_TO_DEPOSIT_IS_NOT_EQUAL_TO_AMOUNT();
error INVALID_ID();
error SAVING_ALREADY_WITHDRAWN();

contract PiggyBank is IPiggyBank {
    Token private token;
    address private owner;
    address private admin;
    uint256 private id;

    mapping(address => Savings []) private savingsMap;

    mapping (uint256 => Savings) private savings;


    constructor(address tokenAddress, address _admin){
        token = Token (tokenAddress);
        admin = _admin;
        owner = msg.sender;
    }





    function createSavings(string memory _savingName, TokenType _tokenType, uint256 _amount, Duration _duration) payable external returns (Savings memory) {
        Savings memory newSavings;
        newSavings.amount = _amount;
        newSavings.duration = _duration;
        newSavings.name = _savingName;
        newSavings.tokenType = _tokenType;
        newSavings.dateCreated = block.timestamp;
        newSavings.savingsId = id++;
        newSavings.owner =msg.sender;
        newSavings.isActive = true;
        newSavings.unlockDate = block.timestamp + getDurationInSeconds(_duration);


        this.deposit(_tokenType, _amount, msg.sender, msg.value);
        savingsMap[msg.sender].push(newSavings);
        savings[newSavings.savingsId] = newSavings;
        return newSavings;
    }

    function deposit (TokenType _tokenType, uint256 _amount, address _owner, uint256 _value ) payable external returns (bool) {

        if (_tokenType == TokenType.ERC20) {
            require(_amount > 0, CAN_NOT_LOCK_ZERO_VALUE());
            require(token.balanceOf(_owner) >= _amount, INSUFFICIENT_BALANCE());
            require(token.allowance(_owner, address(this)) >= _amount, INSUFFICENT_ALLOWANCE());
            bool response = token.transferFrom(_owner, address(this) , _amount);
            if(response) {
                return true;
            }
            revert("Unable to complete savings creation approve withdrawal or top up balance");
        }
        if(_tokenType == TokenType.ETHER) {
            require(_value > 0, CAN_NOT_LOCK_ZERO_VALUE());
            require(_amount == _value, AMOUNT_TO_DEPOSIT_IS_NOT_EQUAL_TO_AMOUNT());
            return true;
        }
        revert("Unable to complete savings creation approve withdrawal or top up balance");
    }


    function getSaving(uint256 savingId) external view returns(Savings memory){
        return savings[savingId];
    }

    function getAllSavings() external view returns(Savings [] memory){
        return savingsMap[msg.sender];
    }
    function withdraw(uint256 savingId) external returns (bool){
        Savings storage mySaving = savings[savingId];
        require(mySaving.isActive == true, SAVING_ALREADY_WITHDRAWN());
        // uint256 duration = getDeadline(mySaving.duration);

        if (mySaving.tokenType == TokenType.ERC20){
            if(block.timestamp >= mySaving.unlockDate){
                mySaving.isActive = false;
                token.transfer(msg.sender, mySaving.amount);
                return true;
            }

            mySaving.isActive = false;
            uint256 penalty = calculatePercentage(mySaving.amount);
            token.transfer(admin, penalty);
            uint256 amountToPay = mySaving.amount - penalty;
            token.transfer(msg.sender, amountToPay);

            return true;

        }
        if (mySaving.tokenType == TokenType.ETHER){
            if(block.timestamp >= mySaving.unlockDate){
                mySaving.isActive = false;   
                payable(msg.sender).transfer(mySaving.amount);
                return true;
            }
            mySaving.isActive = false;
            uint256 ethPenalty = calculatePercentage(mySaving.amount);
            payable(admin).transfer(ethPenalty);
            uint256 amountToPay = mySaving.amount - ethPenalty;
            payable(msg.sender).transfer(amountToPay);
            return true;
            }

        revert("Savings does not exist");

    }

    function calculatePercentage(uint256 amount) private pure returns (uint256){
        return (amount * 3)/100;
    }


    receive() external payable { }

    fallback() external payable { }


    function getDeadline(Duration _duration) public view returns (uint256) {
        return block.timestamp + getDurationInSeconds(_duration);
    }


    function getDurationInSeconds(Duration _duration) public pure returns (uint256) {
        if (_duration == Duration.ONE_MONTH)    return 30 days;
        if (_duration == Duration.TWO_MONTH)    return 60 days;
        if (_duration == Duration.THREE_MONTH)  return 90 days;
        if (_duration == Duration.SIX_MONTH)    return 180 days;
        if (_duration == Duration.NINE_MONTH)  return 270 days;
        if (_duration == Duration.ONE_YEAR)    return 365 days;
        revert("Invalid duration");
    }




}
