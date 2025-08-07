// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "../interfaces/Ierc20.sol";
import "../libraries/Lerc20.sol";

contract erc20token is Ierc20 {
    string name;
    string symbol;
    uint decimal;

    uint public totalSupply;
    address owner;
    mapping (address => uint) public userBalances;
    mapping (address => mapping (address => uint)) allowances;

    constructor () {
        name = "MosasERC20Token";
        symbol = "msk";
        decimal = 18;
        owner = msg.sender;
    }
    using Lerc20 for *;

    function mintToken(address _owner, uint _tokenAmount) external {
        if (_owner != owner) {
            revert Lerc20.ONLY_OWNER_CAN_MINT();
        }
        // userBalances[_owner] = userBalances[_owner] + _tokenAmount;
        userBalances[_owner] += _tokenAmount;
        totalSupply += _tokenAmount;
    }
    function balanceOf (address _user) external view returns (uint) {        
       return userBalances[_user];
    }

    function approve(address _spender, uint _amount) external returns (bool) {
        allowances[msg.sender][_spender] = _amount;
        return true;

    }

    function allowance(address _spender) external view returns (uint) {
        return allowances[msg.sender][_spender];
    }

    function trasfer(address _receiver, uint _amount) external returns (bool) {
        if ( userBalances[msg.sender] <= _amount) {
            revert Lerc20.INSUFFICIENT_BALANCE();
        }
        // userbalances[msg.sender] = userbalances[msg.sender] - _amount;
        userBalances[msg.sender] -= _amount;
        userBalances[_receiver] += _amount;
        return true;
    }

    function transFrom (address _from, address _to, uint _amount) external returns (bool){
    if ( userBalances[_from] < _amount) {
        revert Lerc20.INSUFFICIENT_BALANCE();
    }

    uint allowed_amount = allowances[_from][msg.sender];
    if ( _amount > allowed_amount) { 
        revert Lerc20.AMOUNT_LESS_THAN_ALLOWED_AMOUNT();
    }
    
    userBalances[_from] -= _amount;
    allowances[_from][msg.sender] -= _amount;
    userBalances[_to] += _amount; 

    return true;
}
    

    function _totalSupply() public view returns (uint){
        return totalSupply;
    }
}
