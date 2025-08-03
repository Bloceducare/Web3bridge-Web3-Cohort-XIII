// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IToken{
    struct TokenData {
        string name;
        string symbol;
        address owner;
        uint totalSupply;
    }
    function createToken(string memory _name, string memory _symbol, uint _totalSupply) external;
    function updateTokenName(address _owner, string memory _newName) external;
    function transferOwnerShip(address _newOwner) external ;
    function getTokenDetails(address _owner) external view returns (TokenData memory);
    function deleteToken() external;
    
}