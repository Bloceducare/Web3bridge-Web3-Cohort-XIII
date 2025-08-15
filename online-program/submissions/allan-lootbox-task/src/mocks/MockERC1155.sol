// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockERC1155
 * @dev Mock ERC1155 token for testing purposes
 */
contract MockERC1155 is ERC1155, Ownable {
    string public name;
    string public symbol;

    constructor(
        string memory _name,
        string memory _symbol,
        string memory uri,
        address initialOwner
    ) ERC1155(uri) Ownable(initialOwner) {
        name = _name;
        symbol = _symbol;
    }

    function setURI(string memory newuri) external onlyOwner {
        _setURI(newuri);
    }

    function mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) external onlyOwner {
        _mint(to, id, amount, data);
    }

    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) external onlyOwner {
        _mintBatch(to, ids, amounts, data);
    }

    function burn(
        address from,
        uint256 id,
        uint256 amount
    ) external onlyOwner {
        _burn(from, id, amount);
    }

    function burnBatch(
        address from,
        uint256[] memory ids,
        uint256[] memory amounts
    ) external onlyOwner {
        _burnBatch(from, ids, amounts);
    }
}
