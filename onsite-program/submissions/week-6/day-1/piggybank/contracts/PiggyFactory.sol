// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "./PiggyWallet.sol";

contract PiggyFactory {
    struct WalletResponse {
        string name;
        PiggyWallet.AccountType accountType;
        uint balance;
        uint id;
    }
    address private admin;

    mapping(address => PiggyWallet[]) private walletOwners;

    PiggyWallet[] private allWallets;

    error INVALID_WALLET_ADDRESS();

    uint private counter;

    constructor() {
        admin = msg.sender;
    }

    function createWallet(
        string memory name,
        PiggyWallet.AccountType accountType,
        address contractAddress
    ) external returns (address) {
        counter = counter + 1;
        PiggyWallet wallet = new PiggyWallet(
            counter,
            name,
            accountType,
            contractAddress
        );
        walletOwners[msg.sender].push(wallet);
        wallet.setAdmin(address(this));
        allWallets.push(wallet);
        return address(wallet);
    }

    function getAllUserWallets(
        address user
    ) external view returns (PiggyWallet[] memory) {
        return walletOwners[user];
    }

    function getWalletByAddress(
        address walletAddress
    ) external view returns (WalletResponse memory) {
        PiggyWallet foundWallet = findWallet(walletAddress);
        WalletResponse memory response = WalletResponse(
            foundWallet._name(),
            foundWallet.accountType(),
            foundWallet.getBalance(),
            foundWallet.walletId()
        );
        return response;
    }

    function findWallet(
        address walletAddress
    ) private view returns (PiggyWallet) {
        for (uint _counter; _counter < allWallets.length; _counter++) {
            if (address(allWallets[_counter]) == walletAddress) {
                return allWallets[_counter];
            }
        }
        revert INVALID_WALLET_ADDRESS();
    }

    function withdrawEthFromWallet(
        address walletAddress,
        address payable to,
        uint amount
    ) external {
        require(msg.sender == admin, "Only admin can withdraw");
        PiggyWallet wallet = findWallet(walletAddress);
        wallet.withdrawEthTo(to, amount);
    }

    function withdrawTokensFromWallet(
        address walletAddress,
        address to,
        uint amount
    ) external {
        if (msg.sender != admin) revert("Only admin can withdraw");
        PiggyWallet wallet = findWallet(walletAddress);
        wallet.withdrawTokensTo(to, amount);
    }
}
