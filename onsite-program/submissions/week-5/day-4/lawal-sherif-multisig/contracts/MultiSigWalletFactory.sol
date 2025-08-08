// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./MultiSigWallet.sol"; 

contract MultiSigWalletFactory {
    event WalletCreated(
        address indexed wallet,
        address[] owners,
        uint required,
        address indexed creator
    );
    
    address[] public wallets;
    
    mapping(address => bool) public isWallet;
    
    mapping(address => address[]) public walletsByCreator;
    
    function createWallet(
        address[] memory _owners,
        uint _required
    ) external returns (address wallet) {
        MultiSigWallet newWallet = new MultiSigWallet(_owners, _required);
        wallet = address(newWallet);
        
        wallets.push(wallet);
        isWallet[wallet] = true;
        walletsByCreator[msg.sender].push(wallet);
        
        emit WalletCreated(wallet, _owners, _required, msg.sender);
    }
    
    function createWalletWithSalt(
        address[] memory _owners,
        uint _required,
        bytes32 _salt
    ) external returns (address wallet) {
        MultiSigWallet newWallet = new MultiSigWallet{salt: _salt}(_owners, _required);
        wallet = address(newWallet);
        
        wallets.push(wallet);
        isWallet[wallet] = true;
        walletsByCreator[msg.sender].push(wallet);
        
        emit WalletCreated(wallet, _owners, _required, msg.sender);
    }
    
    function computeWalletAddress(
        address[] memory _owners,
        uint _required,
        bytes32 _salt,
        address _deployer
    ) external view returns (address predictedAddress) {
        bytes memory bytecode = abi.encodePacked(
            type(MultiSigWallet).creationCode,
            abi.encode(_owners, _required)
        );
        
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                _deployer,
                _salt,
                keccak256(bytecode)
            )
        );
        
        predictedAddress = address(uint160(uint(hash)));
    }
    
    function getWalletCount() external view returns (uint) {
        return wallets.length;
    }
    
    function getAllWallets() external view returns (address[] memory) {
        return wallets;
    }
    
    function getWalletsByCreator(address _creator) external view returns (address[] memory) {
        return walletsByCreator[_creator];
    }
    
    function getWalletCountByCreator(address _creator) external view returns (uint) {
        return walletsByCreator[_creator].length;
    }
}