// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyERC1155 is ERC1155, Ownable {
    constructor() ERC1155("https://plum-acute-chimpanzee-234.mypinata.cloud/ipfs/bafybeib3guzdb7eai7xpz4uhyvf4ur76ll4piwl3tazbehlpklvh4nkmsu/meta.json") Ownable(msg.sender) {}

    function mint(address to, uint256 id, uint256 amount, bytes memory data) external onlyOwner {
        _mint(to, id, amount, data);
    }
}
