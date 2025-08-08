pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./TicketNFT.sol";

contract TicketingPlatform {
    IERC20 public token;
    TicketNFT public ticketNFT;
    uint256 public ticketPrice;
    address public owner;

    constructor(address _token, address _ticketNFT, uint256 _ticketPrice) {
        token = IERC20(_token);
        ticketNFT = TicketNFT(_ticketNFT);
        ticketPrice = _ticketPrice;
        owner = msg.sender;
    }

    function buyTicket(string memory tokenURI) public {
        require(token.balanceOf(msg.sender) >= ticketPrice, "Insufficient token balance");
        require(token.allowance(msg.sender, address(this)) >= ticketPrice, "Insufficient allowance");
        token.transferFrom(msg.sender, address(this), ticketPrice);
        ticketNFT.mintTicket(msg.sender, tokenURI);
    }

    function withdrawTokens(uint256 amount) public {
        require(msg.sender == owner, "Not owner");
        token.transfer(owner, amount);
    }
}