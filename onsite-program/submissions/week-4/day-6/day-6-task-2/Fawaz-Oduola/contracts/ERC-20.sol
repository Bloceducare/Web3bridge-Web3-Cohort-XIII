// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.15;


error ExceedsLimit(uint256 allowed, uint256 attempted);
error InsufficientBalance(string error_message);
error UNAUTHORIZED(string error_message);

interface IERC20 {
    function totalSupply() external view  returns (uint256);
    function balanceOf(address _owner) external view returns(uint256);
    function transfer(address _to, uint256 _value) external  returns (bool);
    function transferFrom(address _from, address _to, uint256 _value) external returns (bool success);
    function approve(address _spender, uint256 _value) external  returns (bool success);
    function allowance(address _owner, address _spender) external view returns (uint256 remaining);

    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(address indexed _owner, address indexed _spender, uint256 _value);
}

contract CHILD_TOKEN is IERC20{
    string public NAME;
    string public SYMBOL;
    uint8 public DECIMALS = 16;
    address public immutable owner;

    uint256 _totalSupply;

        

    mapping (address=>uint256) _balanceOf;
    mapping (address=> mapping (address => uint256)) public _allowance;

    constructor(string memory _name, string memory _symbol, address _owner){

        NAME = _name;
        SYMBOL = _symbol;
        owner = _owner;
        _totalSupply = 1000000000*10**DECIMALS;
        _balanceOf[owner] = _totalSupply;

    }


    function name() external view returns (string memory){
        return NAME;
    }

    function balanceOf(address _owner) external view returns(uint256){
        return _balanceOf[_owner];
    }

    function decimals() external view returns (uint256){
        return DECIMALS;
    }

    function totalSupply() external view  returns (uint256){
        return _totalSupply;
    }

    function symbol() public view returns (string memory){
        return SYMBOL;
    }


    function transfer(address _to, uint256 _value) external  returns (bool success){
        if (_balanceOf[msg.sender] < _value){
            revert InsufficientBalance("Insufficient Balance");
        }

        _balanceOf[msg.sender] = _balanceOf[msg.sender] - _value;
        _balanceOf[_to] = _balanceOf[_to] + _value;
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success){
        if (_allowance[_from][msg.sender]  == 0){
            revert UNAUTHORIZED("unauthorised to send from this address");
        }

        if (_allowance[_from][msg.sender] < _value) {
            revert ExceedsLimit(_allowance[_from][_to], _value);
        }

       _balanceOf[_from] = _balanceOf[_from] - _value;
       _balanceOf[_to] = _balanceOf[_to] + _value;
       _allowance[_from][msg.sender] = _allowance[_from][msg.sender] - _value;
       emit Transfer(_from, _to, _value);
       return true;
    }
 
    function approve(address _spender, uint256 _value) public returns (bool success){

        _allowance[msg.sender][_spender] = 0; 
        _allowance[msg.sender][_spender] = _value;
        
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function allowance(address _owner, address _spender) public view returns (uint256){
        return _allowance[_owner][_spender];        
    }

}