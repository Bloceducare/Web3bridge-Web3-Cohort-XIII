// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../contracts/erc.sol";

contract erc20factory {
    address[] public listoferc20token;

    function createToken() public {
        erc20token newToken = new erc20token();
        
        address newTokenAddress = address(newToken);
        listoferc20token.push(newTokenAddress);
    }

    function getDeployedTokens() external view returns (uint256) {
        return listoferc20token.length;
    }
    
    function getallcontract() external view returns ( address[] memory ) {
        return listoferc20token;
    }
}