// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;
import "./MultiSig.sol";

contract MultiSigFactory {
    address[] listOfMultiSigWallets;
    event MultiSigCreated(address indexed _contract_address);

    function createMultiSigWallet(
        address[] memory _owners,
        uint _numConfirmationsRequired
    ) external {
        MultiSigWallet _new_multisig = new MultiSigWallet(
            _owners,
            _numConfirmationsRequired
        );

        listOfMultiSigWallets.push(address(_new_multisig));
        emit MultiSigCreated(address(_new_multisig));
    }

    function getMultiSigWallet(uint _index) external view returns (address) {
        require(_index < listOfMultiSigWallets.length, "Index is not found");
        return listOfMultiSigWallets[_index];
    }

    function getMultiSigWalletsLength() external view returns (uint) {
        return listOfMultiSigWallets.length;
    }
}
