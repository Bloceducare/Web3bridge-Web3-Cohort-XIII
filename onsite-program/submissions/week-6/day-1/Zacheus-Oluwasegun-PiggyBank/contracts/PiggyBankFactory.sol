// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "./PiggyBank.sol";

contract PiggyBankFactory {
    address public admin;
    mapping(address => address) public userPiggyBanks;
    address[] public allPiggyBanks;
    
    event PiggyBankCreated(address indexed user, address piggyBankAddress);
    event BreakingFeeCollected(uint amount, address from);
    
    constructor() {
        admin = msg.sender;
    }
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this");
        _;
    }

    receive() external payable {}

    
    function createPiggyBank() external returns (address) {
        require(userPiggyBanks[msg.sender] == address(0), "User already has a PiggyBank");
        
        PiggyBank newPiggyBank = new PiggyBank(msg.sender, address(this));
        address piggyBankAddress = address(newPiggyBank);
        
        userPiggyBanks[msg.sender] = piggyBankAddress;
        allPiggyBanks.push(piggyBankAddress);
        
        emit PiggyBankCreated(msg.sender, piggyBankAddress);
        return piggyBankAddress;
    }
    
    function getUserPiggyBank(address _user) external view onlyAdmin returns (address) {
        return userPiggyBanks[_user];
    }
    
    function getAllPiggyBanks() external view  onlyAdmin returns (address[] memory) {
        return allPiggyBanks;
    }    
        
}