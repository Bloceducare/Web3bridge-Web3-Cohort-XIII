// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "./Erc-20.sol";
 
contract Erc20Factory {

    mapping (address => address[]) deployedTokenByCreator;
    address[] allContractAddress;


    function createToken(string memory _name, string memory _symbol, uint8 _decimals, uint256 total_supply) external {
        Token myToken = new Token(_name, _symbol, _decimals, total_supply, msg.sender);

        address tokenAddress = address(myToken);

        deployedTokenByCreator[msg.sender].push(tokenAddress);
        allContractAddress.push(tokenAddress);

    }

    function getAllAddress ()external view returns(address [] memory){
        return allContractAddress;

    }
}