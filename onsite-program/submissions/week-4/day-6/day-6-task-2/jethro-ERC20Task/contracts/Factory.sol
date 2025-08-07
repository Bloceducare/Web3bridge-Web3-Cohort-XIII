// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;
import "./MyToken.sol";

contract Factory{
    address [] public AllERC20Tokens;

    function createERC20Token(string memory name, string memory symbol, uint256 initialSupply) external returns (address) {
        MyToken newToken = new MyToken(name, symbol, initialSupply, msg.sender);
        AllERC20Tokens.push(address(newToken));
        
    }

    function getAllERC20Tokens() external view returns (address[] memory) {
        return AllERC20Tokens;
    }
}