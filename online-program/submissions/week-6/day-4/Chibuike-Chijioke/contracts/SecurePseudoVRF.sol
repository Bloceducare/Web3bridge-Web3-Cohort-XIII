// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

contract SecurePseudoVRF {
    uint256 private nonce;

    event RandomNumberGenerated(address indexed user, uint256 randomNumber);

    function getSecureRandomNumber(uint256 _max) external returns (uint256 random) {
        require(_max > 0, "SecureVRF: max must be greater than 0");

        nonce++;

        bytes32 entropy = keccak256(
            abi.encodePacked(
                blockhash(block.number - 1),
                block.timestamp,
                msg.sender,
                nonce,
                block.prevrandao
            )
        );

        random = uint256(entropy) % _max;

        emit RandomNumberGenerated(msg.sender, random);
    }
}