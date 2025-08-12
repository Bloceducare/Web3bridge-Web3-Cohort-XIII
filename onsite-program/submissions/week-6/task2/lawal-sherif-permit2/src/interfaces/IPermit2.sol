// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IPermit2 {
    // Token and amount in a permit message.
    struct TokenPermissions {
        // Token to transfer.
        address token;
        // Amount to transfer.
        uint256 amount;
    }

    // The permit2 message.
    struct PermitTransferFrom {
        // Permitted token and amount.
        TokenPermissions permitted;
        // Unique identifier for this permit.
        uint256 nonce;
        // Expiration timestamp for this permit.
        uint256 deadline;
    }

    // Specifies the recipient and amount for a transfer.
    struct SignatureTransferDetails {
        // Recipient of tokens.
        address to;
        // Amount to transfer.
        uint256 requestedAmount;
    }

    // Used to reconstruct the signed permit message for multiple token transfers
    struct PermitBatchTransferFrom {
        // the tokens and corresponding amounts permitted for a transfer
        TokenPermissions[] permitted;
        // a unique value for every token owner's signature to prevent signature replays
        uint256 nonce;
        // deadline on the permit signature
        uint256 deadline;
    }

    /// @notice Transfer tokens from a signer to a recipient using a permit signature
    /// @param permit The permit data signed over by the owner
    /// @param transferDetails The spender's requested transfer details for the permitted token
    /// @param owner The owner of the tokens to transfer
    /// @param signature The signature to verify
    function permitTransferFrom(
        PermitTransferFrom calldata permit,
        SignatureTransferDetails calldata transferDetails,
        address owner,
        bytes calldata signature
    ) external;

    /// @notice Transfer multiple tokens from a signer to a recipient using a permit signature
    /// @param permit The permit data signed over by the owner
    /// @param transferDetails The spender's requested transfer details for the permitted tokens
    /// @param owner The owner of the tokens to transfer
    /// @param signature The signature to verify
    function permitTransferFrom(
        PermitBatchTransferFrom calldata permit,
        SignatureTransferDetails[] calldata transferDetails,
        address owner,
        bytes calldata signature
    ) external;

    /// @notice Get the domain separator for permit signatures
    function DOMAIN_SEPARATOR() external view returns (bytes32);
}