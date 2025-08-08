// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./MultiSig.sol";

contract MultiFactory {
  MultiSig[] public multiSIgnatures;

  error INVALID_REQUIRED_SIGNERS();

  function createNewFactory(address[] memory _addresses, uint8 _requiredSigners) external {
    for (uint256 i = 0; i < _addresses.length; i++) {
      if (_addresses[i] == address(0)) {
        revert NOT_A_VALID_ADDRESS();
      }
    }
    if (_requiredSigners != 3 || _requiredSigners > 3) {
      revert INVALID_REQUIRED_SIGNERS();
    }

    MultiSig multiSig = new MultiSig(_addresses, _requiredSigners);

    multiSIgnatures.push(multiSig);
  }

  function getMultiSigs() external view returns (MultiSig[] memory) {
      return multiSIgnatures;
  }
}
