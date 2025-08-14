// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import "./PiggyBank.sol";


contract PiggyFactory{
    address admin;
    address defaultTokens;
    address[] public piggyBanks;


    constructor(address _defaultTokens){
        admin = msg.sender;
        defaultTokens = _defaultTokens;
    }

    modifier onlyAdmin(){
        require(msg.sender == admin, "NOT_ADMIN");
        _;
    }

    function createPiggyBank() external onlyAdmin{
        PiggyBank piggyBank = new PiggyBank(defaultTokens,admin);
        piggyBanks.push(address(piggyBank));
    }

    function getPiggyBanks() external view returns (address[] memory){
        return piggyBanks;
    }

}