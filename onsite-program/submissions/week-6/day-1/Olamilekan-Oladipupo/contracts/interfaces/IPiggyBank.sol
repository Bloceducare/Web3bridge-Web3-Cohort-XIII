// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

interface IPiggyBank {

    enum TokenType {
        ERC20,
        ETHER
    }

    enum Duration {
        ONE_MONTH,
        TWO_MONTH,
        THREE_MONTH,
        SIX_MONTH,
        NINE_MONTH,
        ONE_YEAR
    }

    struct Savings {
        string  name;
        TokenType  tokenType;
        uint256 amount;
        Duration duration;
        uint256 dateCreated;
        uint256 savingsId;
        address  owner;
        bool   isActive;
        uint256 unlockDate;


    }





    function createSavings(string memory _savingName, TokenType _tokenType, uint256 _amount, Duration duration) payable external returns(Savings memory);
    function getSaving(uint256 savingId) external view returns(Savings memory);
    function getAllSavings() external view returns(Savings [] memory);
    function withdraw(uint256 savingId) external  returns (bool);

//    function deposit ()
}
