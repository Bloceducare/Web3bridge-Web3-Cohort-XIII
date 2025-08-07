// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "./ERC20.sol";

contract ERC20Factory {
    address[] public deployedTokens;

    event TokenCreated(address tokenAddress, address creator);

    function createToken() external returns (address) {
        ERC20 token = new ERC20();
        deployedTokens.push(address(token));
        emit TokenCreated(address(token), msg.sender);
        return address(token);
    }

    function getAllTokens() external view returns (address[] memory) {
        return deployedTokens;
    }
}
