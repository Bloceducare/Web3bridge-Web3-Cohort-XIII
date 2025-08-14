// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;
import {ERC721URIStorage, ERC721} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

interface MINT{
    function mint(address _to, string memory _tokenURI) external returns(uint256);
}

contract GatedDAO is  ERC721URIStorage {

    uint256 tokenId;

    constructor() ERC721("GatedDAO", "GDAO") {}

    function mint(address _to, string memory _tokenURI) external returns(uint256){
        tokenId = tokenId + 1;
        _mint(_to, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        return tokenId;
    }

}