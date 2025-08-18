pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MaryjaneBoardGameToken is ERC20, Ownable {
    uint256 public constant MAXIMUM_TOKEN_SUPPLY = 1000000 * 10**18;
    uint256 public constant REQUIRED_STAKE_AMOUNT = 100 * 10**18;

    mapping(address => bool) public approvedGameContracts;

    event GameContractApproved(address indexed contractAddress);
    event GameContractRevoked(address indexed contractAddress);
    event TokensCreated(address indexed recipient, uint256 tokenAmount);

    constructor() ERC20("MaryjaneBoardGameToken", "MBGT") Ownable(msg.sender) {
        _mint(msg.sender, MAXIMUM_TOKEN_SUPPLY);
        emit TokensCreated(msg.sender, MAXIMUM_TOKEN_SUPPLY);
    }

    function approveGameContract(address contractAddress) external onlyOwner {
        require(contractAddress != address(0), "Invalid contract address");
        approvedGameContracts[contractAddress] = true;
        emit GameContractApproved(contractAddress);
    }

    function revokeGameContract(address contractAddress) external onlyOwner {
        approvedGameContracts[contractAddress] = false;
        emit GameContractRevoked(contractAddress);
    }

    function createTokens(address recipient, uint256 tokenAmount) external onlyOwner {
        require(recipient != address(0), "Cannot mint to zero address");
        require(tokenAmount > 0, "Amount must be greater than zero");
        _mint(recipient, tokenAmount);
        emit TokensCreated(recipient, tokenAmount);
    }

    function executeGameTransfer(address sender, address receiver, uint256 tokenAmount) external {
        require(approvedGameContracts[msg.sender], "Only approved games can transfer");
        require(sender != address(0) && receiver != address(0), "Invalid addresses");
        require(balanceOf(sender) >= tokenAmount, "Insufficient balance");

        _transfer(sender, receiver, tokenAmount);
    }

    function getRequiredStakeAmount() external pure returns (uint256) {
        return REQUIRED_STAKE_AMOUNT;
    }

    function checkStakeEligibility(address participant) external view returns (bool) {
        return balanceOf(participant) >= REQUIRED_STAKE_AMOUNT;
    }
}
