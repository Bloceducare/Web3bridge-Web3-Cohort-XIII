// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;
import "./IERC20.sol";
// Uncomment this line to use console.log
// import "hardhat/console.sol";

abstract contract MoviesToken is IERC20 {
    string private name;
    string private symbol;
    uint private totalSupply;
    mapping(address=> uint) private tokenHolders;
    mapping (address=> mapping(address => uint)) private tokenSpenders;
    constructor(string memory _name, string memory _symbol, uint _totalSupply){
        name = _name;
        symbol = _symbol;
        totalSupply = _totalSupply;
    }

    function totalSupply() public view returns(uint){
        return totalSupply;
    }

    function name() external view returns(string memory){
        return name;
    }

    function symbol() external view returns(string memory){
        return name;
    }
    function balanceOf(address _owner) external view returns (uint){
        return tokenHolders[_owner];
    }
    // approve(0x132456789023456789g61r24r775g23t32e, )
    function approve(address spender, uint256 value) external view returns(bool){
        if(tokenHolders[msg.sender] >= value){
            tokenSpenders[msg.sender][spender] = value;
            return true;
        }
        return false;
    }

}
