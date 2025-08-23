// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CustomERC1155 is ERC1155, Ownable {
    constructor()
        ERC1155(
            "https://purple-worthwhile-galliform-89.mypinata.cloud/ipfs/bafkreietyxvg2r6gypeyvumdit4cdrfiyd2cxnmodbqzigttircofsh4um"
        )
        Ownable(msg.sender)
    {}

    function mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public onlyOwner {
        _mint(to, id, amount, data);
    }

    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public onlyOwner {
        _mintBatch(to, ids, amounts, data);
    }
}