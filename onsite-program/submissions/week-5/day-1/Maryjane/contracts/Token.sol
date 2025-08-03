// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;
import "../error/Error.sol";
import "../interfaces/Interface.sol";
contract Token is IToken{
    
    address public owner;
    mapping(address=>TokenData) public tokens;

    
    constructor (){
        owner = msg.sender;
    }
    function createToken(string memory _name, string memory _symbol, uint _totalSupply) external{
        tokens[msg.sender]=TokenData(_name,_symbol,msg.sender,_totalSupply);
    }
    function updateTokenName(address _owner, string memory _newName) external {
        if(_owner != msg.sender) revert Unauthorised();
        tokens[_owner].name =_newName;
    }
    modifier onlyOwner(){
        require(msg.sender == owner,"not owner");
        _;
    }
    function transferOwnerShip(address _newOwner) external onlyOwner{
        if(_newOwner == address(0)) revert InvalidAddress();
        owner = _newOwner;
    }
    function getTokenDetails(address _owner) external view returns(TokenData memory){
        return tokens[_owner];
    }
    function deleteToken() external onlyOwner{
        delete tokens[msg.sender];
    }
    
    }
