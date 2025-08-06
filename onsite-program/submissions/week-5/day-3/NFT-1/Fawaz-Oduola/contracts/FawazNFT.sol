// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ERC721URIStorage, ERC721} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract MyNFT is ERC721URIStorage, Ownable(msg.sender) {
    uint256 private _tokenIds;

    constructor() ERC721("FawazNFT", "FNFT") {
        _tokenIds++;
        uint256 newItemId = _tokenIds;

        _mint(msg.sender, newItemId);
        _setTokenURI(newItemId, "https://blush-rapid-tern-82.mypinata.cloud/ipfs/bafkreicpkjzt3a4rpzevetljhraqdm6cx3h273l6iaw3m2r2vyu4vfbade");
    }

    function mintNFT(address recipient, string memory tokenURI)
        public onlyOwner
        returns (uint256)
    {
        _tokenIds++;
        uint256 newItemId = _tokenIds;

        _mint(recipient, newItemId);
        _setTokenURI(newItemId, tokenURI);

        return newItemId;
    }
}
