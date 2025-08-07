// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "./Trinnode.sol";

contract TrinnodeFactory {
    address[] public tokens;

    function createToken(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint _initialSupply,
        uint _maxSupply
    ) external returns (address) {
        Trinnode token = new Trinnode();
        token.initialize(_name, _symbol, _decimals, _initialSupply, _maxSupply);
        tokens.push(address(token));
        return address(token);
    }

    function getAllTokens() external view returns (address[] memory) {
        return tokens;
    }
}
