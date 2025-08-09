// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "../lib/openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import {ERC721, ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
contract EventNFT is ERC721URIStorage, Ownable(msg.sender){
    uint private _tokensId;
    constructor() ERC721("RAFIK NFT","RFT"){
    }
    
    function mintToken(address recipient, string memory tokenURI) external returns (uint256){
        _tokensId++;
        uint newItemId = _tokensId;
        _mint(recipient, newItemId);
        _setTokenURI(newItemId, tokenURI);
        return newItemId;
        }


}
