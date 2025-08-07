// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import './ChildERC20Token.sol';

contract ERC20Factory {

    address[] listOfTokenAddresses;    
    event ContractCreated(address indexed newContract);    

    function createToken(string calldata _name, string calldata _symbol, uint _decimals) external {
        ERC20Token newERCToken = new ERC20Token(_name, _symbol, _decimals);

        listOfTokenAddresses.push(address(newERCToken));
        emit ContractCreated(address(newERCToken));
    }

    function getToken(uint _id) external view returns (address) {
        return listOfTokenAddresses[_id];
    }

}