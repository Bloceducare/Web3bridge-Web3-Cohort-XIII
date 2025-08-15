// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Project.sol";

contract ProjectFactory {
    address[] public deployedTokens;
    event TokenCreated(address indexed tokenAddress, string name, string symbol, uint256 initialSupply);

    function createToken(
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint256 initialSupply,
        address initialOwner
    ) public returns (address) {
        Project newToken = new Project();
        newToken.mint(initialOwner, initialSupply);
        deployedTokens.push(address(newToken));
        emit TokenCreated(address(newToken), name, symbol, initialSupply);
        return address(newToken);
    }

    function getDeployedTokens() public view returns (address[] memory) {
        return deployedTokens;
    }

    function getTokenCount() public view returns (uint256) {
        return deployedTokens.length;
    }
}