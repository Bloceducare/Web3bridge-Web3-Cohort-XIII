// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./NFT.sol";

contract MyNFTFactory {
    MyNFT[] public nftContracts;

    event NFTContractCreated(
        address indexed creator,
        address nftContract,
        string name,
        string symbol
    );

    function createNFTContract(
        string memory name,
        string memory symbol
    ) external returns (address) {
        MyNFT nft = new MyNFT(name, symbol, msg.sender);
        nftContracts.push(nft);
        emit NFTContractCreated(msg.sender, address(nft), name, symbol);
        return address(nft);
    }

    function getDeployedNFTs() external view returns (MyNFT[] memory) {
        return nftContracts;
    }

    function getNFTAt(uint256 index) external view returns (address) {
        require(index < nftContracts.length, "Index out of range");
        return address(nftContracts[index]);
    }

    function totalNFTContracts() external view returns (uint256) {
        return nftContracts.length;
    }
}
