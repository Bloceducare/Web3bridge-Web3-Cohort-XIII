// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./PiggyBank.sol";
import "./IPiggyBankFactory.sol";

contract PiggyBankFactory is IPiggyBankFactory, Ownable, ReentrancyGuard {
    address public admin;
    uint256 public totalPiggyBanks;
    
    mapping(address => address) public userToPiggyBank;
    mapping(address => bool) public isPiggyBank;
    mapping(address => uint256) public userSavingsCount;
    
    address[] public allPiggyBanks;
    
    event PiggyBankCreated(address indexed user, address indexed piggyBank);
    event NewSavingsPlanNotification(address indexed user, uint256 totalPlans);
    event AdminChanged(address indexed oldAdmin, address indexed newAdmin);
    
    constructor() Ownable(msg.sender) {
        admin = msg.sender;
    }
    
    function createPiggyBank() external nonReentrant {
        require(userToPiggyBank[msg.sender] == address(0), "User already has a piggy bank");
        PiggyBank newPiggyBank = new PiggyBank(msg.sender, address(this));
        address piggyBankAddress = address(newPiggyBank);
        userToPiggyBank[msg.sender] = piggyBankAddress;
        isPiggyBank[piggyBankAddress] = true;
        allPiggyBanks.push(piggyBankAddress);
        totalPiggyBanks++;
        emit PiggyBankCreated(msg.sender, piggyBankAddress);
    }
    
    function notifyNewSavingsPlan(address user) external override {
        require(isPiggyBank[msg.sender], "Only piggy bank contracts can call this");
        userSavingsCount[user]++;
        emit NewSavingsPlanNotification(user, userSavingsCount[user]);
    }
    
    function getUserPiggyBank(address user) external view returns (address) {
        return userToPiggyBank[user];
    }
    
    function userHasPiggyBank(address user) external view returns (bool) {
        return userToPiggyBank[user] != address(0);
    }
    
    function getUserBalance(address user, address token) external view returns (uint256) {
        address piggyBankAddr = userToPiggyBank[user];
        if (piggyBankAddr == address(0)) return 0;
        return PiggyBank(piggyBankAddr).getTokenBalance(token);
    }
    
    function getUserSavingsPlans(address user) external view returns (PiggyBank.SavingsPlan[] memory) {
        address piggyBankAddr = userToPiggyBank[user];
        require(piggyBankAddr != address(0), "User doesn't have a piggy bank");
        return PiggyBank(piggyBankAddr).getActiveSavingsPlans();
    }
    
    function getUserSavingsCount(address user) external view returns (uint256) {
        return userSavingsCount[user];
    }
    
    function getAllPiggyBanks() external view returns (address[] memory) {
        return allPiggyBanks;
    }
    
    function getPiggyBanksPaginated(uint256 offset, uint256 limit) external view returns (address[] memory) {
        require(offset < allPiggyBanks.length, "Offset out of bounds");
        uint256 end = offset + limit;
        if (end > allPiggyBanks.length) {
            end = allPiggyBanks.length;
        }
        address[] memory result = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = allPiggyBanks[i];
        }
        return result;
    }
    
    function getUserStats(address user) external view returns (
        address piggyBank,
        uint256 savingsCount,
        bool hasPiggyBank
    ) {
        piggyBank = userToPiggyBank[user];
        savingsCount = userSavingsCount[user];
        hasPiggyBank = piggyBank != address(0);
    }
    
    function setAdmin(address newAdmin) external {
        require(msg.sender == admin, "Only admin can set new admin");
        require(newAdmin != address(0), "New admin cannot be zero address");
        address oldAdmin = admin;
        admin = newAdmin;
        emit AdminChanged(oldAdmin, newAdmin);
    }
    
    function getFactoryStats() external view returns (
        uint256 totalBanks,
        uint256 totalUsers,
        address factoryAdmin
    ) {
        return (totalPiggyBanks, allPiggyBanks.length, admin);
    }
    
    function isPiggyBankValid(address piggyBankAddr) external view returns (bool) {
        return isPiggyBank[piggyBankAddr];
    }
    
    function getPiggyBankOwner(address piggyBankAddr) external view returns (address) {
        require(isPiggyBank[piggyBankAddr], "Invalid piggy bank address");
        return PiggyBank(piggyBankAddr).owner();
    }
    
    function getMultipleUserBalances(address[] calldata users, address token) external view returns (uint256[] memory balances) {
        balances = new uint256[](users.length);
        for (uint256 i = 0; i < users.length; i++) {
            address piggyBankAddr = userToPiggyBank[users[i]];
            if (piggyBankAddr != address(0)) {
                balances[i] = PiggyBank(piggyBankAddr).getTokenBalance(token);
            }
        }
        return balances;
    }
    
    function transferFactoryOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        _transferOwnership(newOwner);
    }
}
