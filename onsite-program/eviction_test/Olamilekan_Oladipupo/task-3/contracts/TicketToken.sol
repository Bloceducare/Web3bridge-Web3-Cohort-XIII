// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TicketToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("Ticket", "TKT") {
        _mint(msg.sender, initialSupply);
    }

}

// Ludo Game
// Design and implement a ludo game where each user has a name, score and and color they represent: Available colors are: RED, GREEN, BLUE, YELLOW.
// Each user must be registered before they can play and you can have a maximum of four players.
// Create a dice rolling algorithm to generate a random number for the dice, and make sure yo implement it for the dice.
// Each move must be calculated by the dice roll and properly calculated
// You have to create a token for interaction.
// Each user must stake a token when you are trying to start the game and the winner takes al
// Test with hardhat
// i hope you understand ludo game keep it simple please nothing complex, it is a test, check my ludo.sol in task-3 i have create the token file aleardy