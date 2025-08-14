// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "../interfaces/IERC7432.sol";

import  "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";


contract MyNft is ERC721URIStorage{
    uint256 private _nextTokenId;

    constructor() ERC721("DAONft", "DNFT") {}

    function mintAndGrantRole(address recipient, string memory tokenURI, bytes32 roleId,uint64 expirationDate,bool revocable,bytes calldata data ) public {
        uint256 tokenId = _nextTokenId++;
        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, tokenURI);

        IERC7432.Role memory role;
        role.roleId = roleId;
        role.tokenAddress = address(this);
        role.tokenId = tokenId;
        role.recipient = recipient;
        role.expirationDate = expirationDate;
        role.revocable = revocable;
        role.data = data;
        IERC7432(address(this)).grantRole(role);
    }
}