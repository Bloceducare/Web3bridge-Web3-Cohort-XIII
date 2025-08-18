// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MultiSig.sol";

contract MultiSigFactory {
    MultiSig[] public allWallets;
    mapping(address => MultiSig[]) public walletsOf;

    event MultiSigCreated(
        address indexed wallet,
        address indexed creator,
        uint256 indexed requiredSignatures
    );


    function createMultiSig(address[] calldata _owners, uint256 _requiredSignatures) external payable returns (MultiSig wallet){
        require(_owners.length > 0, "owners required");
        require(_requiredSignatures >= 1 && _requiredSignatures <= _owners.length, "invalid required");

        wallet = new MultiSig(_owners, _requiredSignatures);

        if (msg.value > 0){(bool sent, ) = payable(address(wallet)).call{value: msg.value}("");
            require(sent, "funding failed");
        }


        allWallets.push(wallet);
        walletsOf[msg.sender].push(wallet);

        emit MultiSigCreated(address(wallet), msg.sender, _requiredSignatures);
    }

    function totalWallets() external view returns (uint256) {
        return allWallets.length;
    }

    function getWalletsOf(address creator) external view returns (MultiSig[] memory) {
        return walletsOf[creator];
    }
}

