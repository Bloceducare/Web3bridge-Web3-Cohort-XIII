// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {ERC721, ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";


contract TicketNft is ERC721URIStorage, Ownable(msg.sender){

     uint256 private _tokenIds;

    constructor() ERC721("EVENTWEB3", "EVW") {}
    

    function mintNFT(address recipient, string memory tokenURI)
        public 
        returns (uint256)
    {
        _tokenIds++;
        uint256 newItemId = _tokenIds;

        _mint(recipient, newItemId);
        _setTokenURI(newItemId, tokenURI);

        return newItemId;
    }
}