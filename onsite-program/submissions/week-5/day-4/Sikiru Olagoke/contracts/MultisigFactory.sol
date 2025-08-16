
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";
//

import "./Multisig.sol";

contract MultisigFactory {

  address owner;
  
  address[] multisigChild;


  function create_multisig(address[] memory _owners, uint _confirmations) external {

    owner = msg.sender;

    Multisig new_multisig = new Multisig(_owners, _confirmations, owner);
    multisigChild.push(address(new_multisig));
    
  }

  function get_all_contracts() external view returns (address[] memory) {
    return multisigChild;
  }

}
