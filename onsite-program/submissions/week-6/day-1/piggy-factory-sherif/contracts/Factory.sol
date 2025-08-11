// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./Piggy.sol";

contract PiggyFactory {
    address public owner;
    address[] public deployedPiggys;
    mapping(address => address[]) public userToPiggys; // Track piggys created by each user
    
    event PiggyCreated(address indexed creator, address indexed piggyAddress, address indexed tokenAddress);
    
    constructor() {
        owner = msg.sender;
    }
    function createPiggy(address _tokenAddress) external returns (address) {
        require(_tokenAddress != address(0), "Token address cannot be zero");
        
        // Deploy a new Piggy contract
        Piggy newPiggy = new Piggy(_tokenAddress);
        address piggyAddress = address(newPiggy);
        
        // Store the deployed contract address
        deployedPiggys.push(piggyAddress);
        userToPiggys[msg.sender].push(piggyAddress);
        
        emit PiggyCreated(msg.sender, piggyAddress, _tokenAddress);
        
        return piggyAddress;
    }
    
    /**
     * @dev Get all deployed Piggy contracts
     * @return Array of all deployed Piggy contract addresses
     */
    function getDeployedPiggys() external view returns (address[] memory) {
        return deployedPiggys;
    }
    
    /**
     * @dev Get all Piggy contracts created by a specific user
     * @param _user The address of the user
     * @return Array of Piggy contract addresses created by the user
     */
    function getUserPiggys(address _user) external view returns (address[] memory) {
        return userToPiggys[_user];
    }
    
    /**
     * @dev Get the total number of deployed Piggy contracts
     * @return The count of deployed contracts
     */
    function getDeployedPiggysCount() external view returns (uint256) {
        return deployedPiggys.length;
    }
    
    /**
     * @dev Get the count of Piggy contracts created by a specific user
     * @param _user The address of the user
     * @return The count of contracts created by the user
     */
    function getUserPiggyCount(address _user) external view returns (uint256) {
        return userToPiggys[_user].length;
    }
}