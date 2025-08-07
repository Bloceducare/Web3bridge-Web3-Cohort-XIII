// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "./ERC-20.sol";



contract ERC_20_FACTORY{

    address[] public erc_20_contracts;
    mapping (address owner => address contracts) ownerToContracts;

    constructor(){

    }

    function create_erc_20_contract(string memory _name, string memory _symbol) external {
        CHILD_TOKEN new_erc_20 = new CHILD_TOKEN(_name, _symbol, msg.sender);
        erc_20_contracts.push(address(new_erc_20));
        ownerToContracts[msg.sender] = address(new_erc_20);
    }


    function balanceOf(address _owner, uint256 _index) external view returns(uint256){
        if (_index >= erc_20_contracts.length){
            revert("index out of range");
        }
        CHILD_TOKEN child_token = CHILD_TOKEN(erc_20_contracts[_index]);
        return child_token.balanceOf(_owner);
    }

    function decimals(uint256 _index) external view returns (uint256){
        if (_index >= erc_20_contracts.length){
            revert("index out of range");
        }
        CHILD_TOKEN child_token = CHILD_TOKEN(erc_20_contracts[_index]);
        return child_token.decimals();
    }

    function name(uint256 _index) external view returns (string memory){
        if (_index >= erc_20_contracts.length){
            revert("index out of range");
        }
        CHILD_TOKEN child_token = CHILD_TOKEN(erc_20_contracts[_index]);
        return child_token.name();
    }


    function totalSupply(uint256 _index) external view  returns (uint256){
        if (_index >= erc_20_contracts.length){
            revert("index out of range");
        }
        CHILD_TOKEN child_token = CHILD_TOKEN(erc_20_contracts[_index]);
        return child_token.totalSupply();
    }

    function symbol(uint256 _index) public view returns (string memory){
        if (_index >= erc_20_contracts.length){
            revert("index out of range");
        }
        CHILD_TOKEN child_token = CHILD_TOKEN(erc_20_contracts[_index]);
        return child_token.symbol();
    }

    // function transfer(address _to, uint256 _value, uint256 _index) external  returns (bool success){
    //     if (_index >= erc_20_contracts.length){
    //         revert("index out of range");
    //     }
    //     CHILD_TOKEN child_token = CHILD_TOKEN(erc_20_contracts[_index]);
    //     child_token.transfer(_to, _value);
    //     return true;
    // }

    // function transferFrom(address _from, address _to, uint256 _value, uint256 _index) public returns (bool success){
    //     if (_index >= erc_20_contracts.length){
    //         revert("index out of range");
    //     }
    //     CHILD_TOKEN child_token = CHILD_TOKEN(erc_20_contracts[_index]);
    //     return child_token.transferFrom(_from, _to, _value);
    // }
 
    // function approve(address _spender, uint256 _value, uint256 _index) public returns (bool success){
    //     if (_index >= erc_20_contracts.length){
    //         revert("index out of range");
    //     }
    //     CHILD_TOKEN child_token = CHILD_TOKEN(erc_20_contracts[_index]);
    //     child_token.approve(_spender, _value);
    //     return true;
    // }

    // function allowance(address _owner, address _spender, uint256 _index) public view returns (uint256){
    //     if (_index >= erc_20_contracts.length){
    //         revert("index out of range");
    //     }
    //     CHILD_TOKEN child_token = CHILD_TOKEN(erc_20_contracts[_index]);
    //     return child_token.allowance(_owner, _spender);        
    // }

    function getContractAddress() external view returns (address){
        if (ownerToContracts[msg.sender] == address(0)){
            revert("you don't have a child contract");
        }
        return ownerToContracts[msg.sender];
    }

    function getAllContractAddresses() external view returns(address[] memory){
        return erc_20_contracts;
    }
}