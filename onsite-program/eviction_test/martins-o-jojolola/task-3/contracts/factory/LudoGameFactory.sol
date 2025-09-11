// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./../LudoGame.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LudoFactory {
    event GameCreated(address game, address token, uint256 stakeAmount);

    address[] public games;

    function createGame(
        IERC20 token,
        uint256 stakeAmount
    ) external returns (address) {
        LudoGame game = new LudoGame(token, stakeAmount);
        games.push(address(game));
        emit GameCreated(address(game), address(token), stakeAmount);
        return address(game);
    }

    function getAllGames() external view returns (address[] memory) {
        return games;
    }
}
