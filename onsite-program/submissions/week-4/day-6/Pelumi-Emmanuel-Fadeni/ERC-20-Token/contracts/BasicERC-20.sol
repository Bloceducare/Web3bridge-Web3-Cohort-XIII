// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import "../Interfaces/IERC-20.sol";


contract BasicERC20 is IERC20 {
    string public name = "Basic Token";
    string public symbol = "BASIC";
    uint8 public decimals = 18;
    uint256 public totalSupply = 1000000 * 10**18; // 1 million tokens
    
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
   
    
    /**
     * @dev Constructor that assigns total supply to contract deployer
     * This runs once when the contract is deployed
     */
    constructor() {
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }
    
    /**
     * @dev Transfer tokens from caller to recipient
     * @param to The address to transfer tokens to
     * @param amount The amount of tokens to transfer
     * @return Boolean indicating success
     */
    function transfer(address to, uint256 amount) public returns (bool) {
        require(to != address(0), "Transfer to zero address");
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    /**
     * @dev Approve spender to spend amount of caller's tokens
     * @param spender The address to approve
     * @param amount The amount to approve
     * @return Boolean indicating success
     */
    function approve(address spender, uint256 amount) public returns (bool) {
        require(spender != address(0), "Approve to zero address");
        
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    /**
     * @dev Transfer tokens from one address to another using allowance
     * @param from The address to transfer from
     * @param to The address to transfer to
     * @param amount The amount to transfer
     * @return Boolean indicating success
     */
    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        require(from != address(0), "Transfer from zero address");
        require(to != address(0), "Transfer to zero address");
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;
        
        emit Transfer(from, to, amount);
        return true;
    }
}