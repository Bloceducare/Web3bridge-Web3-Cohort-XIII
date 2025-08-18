// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;

import "./MartinsToken.sol";

contract MartinsTokenFactory {
    address[] public tokens;
    uint256 public tokenCounter;
    mapping(address => bool) public isFactoryToken;

    event TokenCreated(
        address indexed tokenAddress,
        address indexed creator,
        string name,
        string symbol,
        uint8 decimals,
        uint256 totalSupply
    );

    function createMartinsToken(
        string calldata name_,
        string calldata symbol_,
        uint8 decimals_,
        uint256 totalSupply_
    ) external returns (address tokenAddress) {
        MartinsToken newToken = new MartinsToken(
            name_,
            symbol_,
            decimals_,
            totalSupply_
        );

        tokenAddress = address(newToken);
        require(tokenAddress != address(0), "Token creation failed");

        newToken.transferOwnership(msg.sender);

        tokens.push(tokenAddress);
        isFactoryToken[tokenAddress] = true;
        tokenCounter++;

        emit TokenCreated(
            tokenAddress,
            msg.sender,
            name_,
            symbol_,
            decimals_,
            totalSupply_
        );

        return tokenAddress;
    }

    function getTokenCount() public view returns (uint256) {
        return tokens.length;
    }

    function getTokens() public view returns (address[] memory) {
        return tokens;
    }

    function getTokenByIndex(uint256 _index) public view returns (address) {
        require(_index < tokens.length, "Token index out of bounds");
        return tokens[_index];
    }

    function checkIsFactoryToken(
        address tokenAddress
    ) external view returns (bool) {
        return isFactoryToken[tokenAddress];
    }

    function getFactoryInfo()
        external
        view
        returns (
            uint256 count,
            uint256 counter,
            uint256 arrayLength,
            address[] memory tokensList
        )
    {
        return (tokens.length, tokenCounter, tokens.length, tokens);
    }

    function isTokenFromFactory(
        address tokenAddress
    ) external view returns (bool) {
        return isFactoryToken[tokenAddress];
    }
}
