// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "./multisig.sol";

contract multisigFactory {
    address[] allmultisig;

    function createFactory(address[] memory _admins) external {
        Multisig multi = new Multisig(_admins);

        allmultisig.push(address(multi));
    }

    function getFactory() external view returns (address[] memory) {
        return allmultisig;
    }
}
