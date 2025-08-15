// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";


contract MultiToken is ERC1155 {
    constructor(string memory uri) ERC1155(uri) {}


}
