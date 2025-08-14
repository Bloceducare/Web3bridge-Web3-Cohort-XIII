// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./PiggyBank.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";



contract PiggyBankFactory is Ownable {
   
    mapping(address => address[]) public userPiggyBanks;
    
   
    mapping(address => uint256) public userPiggyBankCount;
    
   
    address[] public allPiggyBanks;
    
    
    event PiggyBankCreated(address indexed user, address indexed piggyBank, uint256 lockPeriod);
    event PiggyBankRemoved(address indexed user, address indexed piggyBank);
    
    constructor() Ownable(msg.sender) {}
    
   
    function createPiggyBank(uint256 lockPeriod, address tokenAddress) external payable {
        require(lockPeriod > 0, "Lock period must be greater than 0");
        
     
        PiggyBank newPiggyBank = new PiggyBank(
            msg.sender,
            lockPeriod,
            tokenAddress,
            address(this)
        );
        
      
        if (tokenAddress == address(0)) {
            require(msg.value > 0, "Must send Ether when creating Ether piggy bank");
            (bool success, ) = address(newPiggyBank).call{value: msg.value}("");
            require(success, "Failed to transfer Ether to piggy bank");
        }
        
        
        userPiggyBanks[msg.sender].push(address(newPiggyBank));
        userPiggyBankCount[msg.sender]++;
        allPiggyBanks.push(address(newPiggyBank));
        
        emit PiggyBankCreated(msg.sender, address(newPiggyBank), lockPeriod);
    }
    
    
    function getUserPiggyBanks(address user) external view returns (address[] memory) {
        return userPiggyBanks[user];
    }
    
    
    function getUserPiggyBankCount(address user) external view returns (uint256) {
        return userPiggyBankCount[user];
    }
    
   
    function getAllPiggyBanks() external view returns (address[] memory) {
        return allPiggyBanks;
    }
    
   
    function getTotalPiggyBankCount() external view returns (uint256) {
        return allPiggyBanks.length;
    }
    
    
    function removePiggyBank(address piggyBankAddress) external {
        address[] storage userBanks = userPiggyBanks[msg.sender];
        bool found = false;
        
        for (uint256 i = 0; i < userBanks.length; i++) {
            if (userBanks[i] == piggyBankAddress) {
                found = true;
                
                PiggyBank piggyBank = PiggyBank(payable(piggyBankAddress));
                require(piggyBank.isClosed(), "Piggy bank must be closed to remove");
                
                // Remove from user's piggy banks
                userBanks[i] = userBanks[userBanks.length - 1];
                userBanks.pop();
                userPiggyBankCount[msg.sender]--;
                
                // Remove from all piggy banks
                for (uint256 j = 0; j < allPiggyBanks.length; j++) {
                    if (allPiggyBanks[j] == piggyBankAddress) {
                        allPiggyBanks[j] = allPiggyBanks[allPiggyBanks.length - 1];
                        allPiggyBanks.pop();
                        break;
                    }
                }
                
                emit PiggyBankRemoved(msg.sender, piggyBankAddress);
                break;
            }
        }
        
        require(found, "Piggy bank not found for user");
    }
   
    function emergencyClosePiggyBank(address piggyBankAddress) external onlyOwner {
        PiggyBank piggyBank = PiggyBank(payable(piggyBankAddress));
        piggyBank.emergencyClose();
    }
    
   
    function withdrawFees(address tokenAddress, uint256 amount) external onlyOwner {
        if (tokenAddress == address(0)) {
           
            require(address(this).balance >= amount, "Insufficient Ether balance");
            (bool success, ) = owner().call{value: amount}("");
            require(success, "Failed to transfer Ether");
        } else {
            
            IERC20 token = IERC20(tokenAddress);
            require(token.balanceOf(address(this)) >= amount, "Insufficient token balance");
            require(token.transfer(owner(), amount), "Failed to transfer tokens");
        }
    }
    
   
    function getFactoryBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    
    function getFactoryTokenBalance(address tokenAddress) external view returns (uint256) {
        if (tokenAddress == address(0)) {
            return address(this).balance;
        }
        return IERC20(tokenAddress).balanceOf(address(this));
    }
    

    function getTotalBalance() external view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < allPiggyBanks.length; i++) {
            total += PiggyBank(payable(allPiggyBanks[i])).balance();
        }
        return total;
    }
    
    function getUserBalance(address user) external view returns (uint256) {
        uint256 total = 0;
        address[] memory userBanks = userPiggyBanks[user];
        for (uint256 i = 0; i < userBanks.length; i++) {
            total += PiggyBank(payable(userBanks[i])).balance();
        }
        return total;
    }
    

    
    
    receive() external payable {}
}
