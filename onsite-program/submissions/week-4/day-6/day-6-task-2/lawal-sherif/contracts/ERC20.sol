// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../interfaces/IERC20.sol";

contract ERC20 is IERC20 {
    // Access control for my contract
    address public owner;
    bool public paused = false;
    uint public maxSupply;

    constructor(uint _maxSupply) {
        maxSupply = _maxSupply;
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    // To keep track of the total amount of token that was minted
    uint public totalSupply;

    // How much each  user has a token
    mapping(address => uint) public balanceOf;

    // when an ERC20 holder calls the function approve approving the sender to...
    // ...spend some of his tokens on his behalf 
    mapping(address  => mapping(address => uint)) public allowance;

    // to store some meta data about the erc20 token e.g: name, symbol & decimals
    string  public name = "Younique";
    string  public symbol = "YNQ";
    uint8 public decimals = 18; //how many deccimal places used to represent the token


    // transfer tokens from msg.sender to our recipient
    function transfer(address recipient,uint amount) external whenNotPaused returns (bool){
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        require(recipient != address(0), "No approval to send to zero address");

        balanceOf[msg.sender] -= amount; //subtract the amount from the sender
        balanceOf[recipient] += amount; //add the amount to the recipient's bal
        emit Transfer(msg.sender, recipient,  amount);
        return true;
    }
    
    // msg.sender will be able to approve  a spender to spend some of his balance for the amount
    function approve(address spender, uint amount) external returns (bool){
        require(spender != address(0), "No approval to send to zero address");
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return  true;
    }

    function transferFrom(
        address sender,
        address recipient,
        uint amount
    ) external whenNotPaused returns (bool) {
        require(sender != address(0), "You can't transfer from address zero");
        require(recipient != address(0), "You can't transfer to address zero");
        require(balanceOf[sender] >= amount, "Insufficient balance");
        require(allowance[sender][msg.sender] >= amount, "Insufficient allowance");

        allowance[sender][msg.sender] -= amount; //if sender has not approved the spender to spend  this token, then this part of the code will fail
        balanceOf[sender] -= amount;
        balanceOf[recipient] += amount;
        emit Transfer(sender,recipient, amount);
        return true;
    }

    // To mint tokens
    function mint(uint amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(totalSupply + amount <= maxSupply, "Would exceed max supply");
        // Increase msg.sender balance with the amount
        balanceOf[msg.sender] += amount;

        // increase the total supply with that amount
        totalSupply += amount;
        // we are not sending an existing token, we are minting new token, so we set the sender to address 0. The recipient is the msg.sender. and the amount is the amount.
        emit Transfer(address(0), msg.sender, amount);
    }

    // To burn and destroy the token from circulation
    function burn(uint amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf[msg.sender] >= amount, "Insufficient balance to burn");
        // Decrease msg.sender balance with the amount
        balanceOf[msg.sender] -= amount;

        // Decrease the total supply with that amount
        totalSupply -= amount;
        // we are not sending an existing token, we are minting new token, so we set the sender to address 0. The recipient is the msg.sender. and the amount is the amount.
        emit Transfer(msg.sender, address(0), amount);
    }

    function pause_transfers() external onlyOwner {
        paused = true;
    }

    function unpause_transfers() external onlyOwner {
        paused = false;
    }
} 