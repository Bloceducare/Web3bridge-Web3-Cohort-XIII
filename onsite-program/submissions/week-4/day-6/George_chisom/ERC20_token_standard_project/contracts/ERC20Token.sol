// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "../interface/TokenInterface.sol";

import { Token } from "../libraries/Token.sol";

contract ERC20Token is iERC20Token {

    Token.TokenInfo public tokenDetails;

    address public admin;

    uint256 private totalSupply;

    mapping(address => uint256) private walletBalances;

    mapping (address => mapping(address => uint256)) private allowances;

    constructor (address _admin, uint256 _firstSupply) {
        require(_admin != address(0), "ADMIN ADDRESS CANNOT BE ZERO");
        
        admin = _admin;

        tokenDetails = Token.TokenInfo({name: "GeorgeCoin", symbol: "GC", digits: 18});


        totalSupply = _firstSupply * 10 ** tokenDetails.digits;

        walletBalances[admin] = totalSupply;
    }

    modifier onlyOwner() {
        require(msg.sender == admin, "only owner can call this function");
        _;
    }
    
    function total_supply() external view returns (uint256) {
        return totalSupply;
    }

    function balanceOf(address account) external view returns (uint256) {
        return walletBalances[account];
    }

	function transfer(address payable  _receiver, uint _amount) external returns (bool) {

        if (walletBalances[msg.sender] < _amount) {

            revert Token.INSUFFICIENT_FUND();

        }

        walletBalances[msg.sender] = walletBalances[msg.sender] - _amount;

        walletBalances[_receiver] = walletBalances[_receiver] + _amount;

        return true;

    }

	function allowance(address payable owner, address payable spender) external view returns (uint) {
        if (owner == address(0) && spender == address(0)){
            revert Token.SENDER_OR_RECEIVER_CANNOT_BE_ZERO_ADDRESS();
        }

        return allowances[owner][spender];

    }

	function approve(address payable spender, uint amount) external returns(bool) {
        if (spender == address(0)){
            revert Token.SENDER_OR_RECEIVER_CANNOT_BE_ZERO_ADDRESS();
        }

        allowances[msg.sender][spender] = amount;

        return true;
    }

    function transferFrom(address payable from, address payable to, uint256 _amount) external returns (bool) {
        require(from != address(0), "Sender cannot be zero address");
        require(to != address(0), "Receiver cannot be zero address");
        require(walletBalances[from] >= _amount, "Insufficient balance");
        require(allowances[from][msg.sender] >= _amount, "Insufficient allowance");

        allowances[from][msg.sender] = allowances[from][msg.sender] - _amount;

        walletBalances[from] = walletBalances[from] - _amount;

        walletBalances[to] = walletBalances[to] + _amount;

        return true;
    }


    // mint function
    function mint_token(address _minter, uint _amount) external onlyOwner {
        if (_minter == address(0)){

            revert Token.MINTER_CANNOT_BE_ZERO_ADDRESS();

        } else if (walletBalances[_minter] <= _amount) {

            revert Token.Balance_Must_Be_Greater_Amount();

        } else if (_amount <= 0) {

            revert Token.Mint_Must_Be_Greater_Than_0();

        } else {
            totalSupply = totalSupply + _amount;
            walletBalances[_minter] =  walletBalances[_minter] + _amount;
        }
    }

    function burn_token(uint _amount) external {
         if (walletBalances[msg.sender] <= _amount) {

            revert Token.Balance_Must_Be_Greater_Amount();
            
        } else if (_amount <= 0) {

            revert Token.Burner_Must_Be_Greater_Than_0();

        } else {
            walletBalances[msg.sender] =  walletBalances[msg.sender] - _amount;
            totalSupply = totalSupply - _amount;
        }
    }

    function view_admin() external onlyOwner view returns (address) {
        return admin;
    }

}