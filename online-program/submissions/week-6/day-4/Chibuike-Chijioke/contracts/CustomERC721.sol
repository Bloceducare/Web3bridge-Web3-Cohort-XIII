// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

contract CustomERC721 {
    string public name = "CollectorNFTX";
    string public symbol = "CNFX";
    uint256 public currentTokenId;

    mapping(uint256 => address) public ownerOf;
    mapping(address => uint256) public balanceOf;

    event NFTMinted(address indexed to, uint256 tokenId);

    function mintNFT(address _to) external returns (uint256) {
        currentTokenId += 1;
        ownerOf[currentTokenId] = _to;
        balanceOf[_to] += 1;
        emit NFTMinted(_to, currentTokenId);
        return currentTokenId;
    }
}