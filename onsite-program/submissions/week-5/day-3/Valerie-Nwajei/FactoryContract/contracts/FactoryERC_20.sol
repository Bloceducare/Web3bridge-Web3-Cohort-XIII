// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./ERC_20.sol";

contract ERC20Factory{
    address[] accounts;

    function create_ERC20(address _owner, string memory _name, string memory _symbol, uint8 _decimal, uint256 _totalSupply) external{
        _owner = msg.sender;
        ERC20 account = new ERC20(_name, _symbol, _decimal, _totalSupply);
        accounts.push(address(account));
    }
    function getContracts() external view returns(address[] memory){
        return accounts;
    }
}