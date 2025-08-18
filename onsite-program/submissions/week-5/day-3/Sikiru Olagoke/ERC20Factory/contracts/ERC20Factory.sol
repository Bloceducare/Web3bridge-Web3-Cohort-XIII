
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "./ERC20Standard.sol";

contract ERC20Factory {

  address[] ERC20Tokens;


  function create_token(string memory _name, string memory _symbol, uint8 _decimal, uint256 _totalSupply, address _owner) external {
    _owner = msg.sender;
    
    ERC20Standard ercToken = new ERC20Standard(_name, _symbol, _decimal, _totalSupply, _owner);

    ERC20Tokens.push(address(ercToken));

  }

  function get_all_tokens() external view returns (address[] memory) {
    return ERC20Tokens;
  }
}
