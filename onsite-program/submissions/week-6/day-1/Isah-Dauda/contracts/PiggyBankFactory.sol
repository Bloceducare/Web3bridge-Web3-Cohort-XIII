// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// import "./IPiggyBankFactory.sol";
import "./PiggyBank.sol";

contract PiggyBankFactory is Ownable {
    using SafeERC20 for IERC20;

    constructor() Ownable(msg.sender) {}

    mapping(address => address) public userToPiggyBank;
    mapping(address => bool) public isPiggyBank;
    address[] public allPiggyBanks;

    event PiggyBankCreated(address indexed user, address indexed piggyBank);
    event PenaltyLogged(address indexed token, uint amount);
    event PenaltiesWithdrawn(address indexed token, uint amount);

    function createPiggyBank() external {
        if (userToPiggyBank[msg.sender] != address(0)) revert PIGGY_BANK_ALREADY_EXISTS();

        PiggyBank brandPiggyBank = new PiggyBank(msg.sender, address(this));

        userToPiggyBank[msg.sender] = address(brandPiggyBank);
        isPiggyBank[address(brandPiggyBank)] = true;
        allPiggyBanks.push(address(brandPiggyBank));
    }

    function logPenalty(address token, uint amount) external {
        if (!isPiggyBank[msg.sender]) revert ONLY_PIGGY_BANK_CAN_CALL();
        
        emit PenaltyLogged(token, amount);
    }

    function withdrawPenaltiesETH() external onlyOwner {
        uint balance = address(this).balance;
        if (balance == 0) revert NO_PENALTIES_TO_WITHDRAW();

        (bool success, ) = payable(owner()).call{value: balance}("");

        if (!success) revert TRANSFER_FAILED();

        emit PenaltiesWithdrawn(address(0), balance);
    }
    

    function withdrawPenaltiesERC20(address token) external onlyOwner{
        uint balance = IERC20(token).balanceOf(address(this));
        if (balance == 0) revert NO_PENALTIES_TO_WITHDRAW();

        IERC20(token).safeTransfer(owner(), balance);

        emit PenaltiesWithdrawn(token, balance);
    }

    function getUserPiggyBank(address _user) external view returns(address) {
        return userToPiggyBank[_user];
    } 

    function getAllPiggyBanks() external view returns(address[] memory) {
        return allPiggyBanks;
    }

    receive() external payable{}
}