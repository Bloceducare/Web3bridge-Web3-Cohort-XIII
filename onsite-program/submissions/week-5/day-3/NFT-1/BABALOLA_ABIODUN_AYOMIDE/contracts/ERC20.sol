// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "./IERC20.sol";

library Error {
    error INSUFFICIENT_ALLOWANCE();
    error INSUFFICIENT_BALANCE();
}
contract ERC20 is IERC20{
    string tokenName ;
    string tokenSymbol;
    uint8 tokenDecimals;
    uint tokenTotalSupply;
    mapping (address=> uint) tokenOwners;
    mapping (address => mapping(address=>uint)) tokenSpenders;

    constructor(string memory _name, string memory _symbol, uint8 _tokenDecimal, uint tokenSupply){
        tokenName = _name;
        tokenDecimals = _tokenDecimal;
        tokenSymbol = _symbol;
        tokenTotalSupply = tokenSupply;
    }
    function name() external view returns (string memory){
        return tokenName;
    }

    function decimals() external view returns (uint8){
        return tokenDecimals;
    }

    function symbol() external view returns (string memory){
        return tokenSymbol;

    }

    function totalSupply() external view returns (uint256){
        return tokenTotalSupply;
    }

     function balanceOf(address _owner) external view returns (uint256 balance){
        return tokenOwners[_owner];
    }

    function transfer(address _to,uint256 _value) external returns (bool success){
        require(tokenOwners[msg.sender]>0,"INSUFFICIENT_BALANCE");
        if(tokenOwners[msg.sender]>0 && tokenOwners[msg.sender]>= _value){
            tokenOwners[msg.sender]-= _value;
            tokenOwners[_to]+=_value;
            emit Transfer(msg.sender, _to, _value);
            return true;
        }           
        return false;
    }

    function buyToken(address buyer, uint amount)public {
        tokenOwners[buyer] = amount;
    }
    
    function transferFrom(address _from, address _to, uint256 _value) external returns (bool success){
        if (tokenSpenders[_from][msg.sender] < _value) {
            revert Error.INSUFFICIENT_ALLOWANCE();
        }
        if (tokenOwners[_from] < _value) {
            revert Error.INSUFFICIENT_BALANCE();
        }
        tokenSpenders[_from][msg.sender] -=_value;
        tokenOwners[_from]-=_value;
        tokenOwners[_to]+=_value;
        emit Transfer(_from, _to, _value);
        return true;
    }

    function approve(address _spender,uint256 _value) external returns (bool success){
        tokenSpenders[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }
    function allowance(address _owner, address _spender) external view returns (uint256 remaining){
        return tokenSpenders[_owner][_spender];
    }

}