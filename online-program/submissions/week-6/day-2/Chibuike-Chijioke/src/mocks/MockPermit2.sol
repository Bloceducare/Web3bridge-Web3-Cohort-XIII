// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import { ISignatureTransfer } from "permit2/interfaces/ISignatureTransfer.sol";

// Mock for Permit2 to simulate permitTransferFrom
contract MockPermit2 is ISignatureTransfer {
    event PermitUsed(address from, address to, uint256 amount);

    function nonceBitmap(address, uint256) external pure override returns (uint256) {
        return 0;
    }

    function permitTransferFrom(
        PermitTransferFrom memory,
        SignatureTransferDetails calldata transferDetails,
        address owner,
        bytes calldata
    ) external override {
        emit PermitUsed(owner, transferDetails.to, transferDetails.requestedAmount);
    }

    function permitWitnessTransferFrom(
        PermitTransferFrom memory,
        SignatureTransferDetails calldata,
        address,
        bytes32,
        string calldata,
        bytes calldata
    ) external pure override {}

    function permitTransferFrom(
        PermitBatchTransferFrom memory,
        SignatureTransferDetails[] calldata,
        address,
        bytes calldata
    ) external pure override {}

    function permitWitnessTransferFrom(
        PermitBatchTransferFrom memory,
        SignatureTransferDetails[] calldata,
        address,
        bytes32,
        string calldata,
        bytes calldata
    ) external pure override {}

    function invalidateUnorderedNonces(uint256, uint256) external pure override {}

    function DOMAIN_SEPARATOR() external pure override returns (bytes32) {
        return bytes32(0);
    }
}