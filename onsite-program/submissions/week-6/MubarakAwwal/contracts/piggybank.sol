// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "./IPiggyBank.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PiggyBank is IPiggyBank {
    address public owner;
    address public admin;
    uint public lockPeriod;
    address public tokenAddress;
    uint public startTime;

    constructor(address _owner, address _admin, uint _lockPeriod, address _tokenAddress) {
        owner = _owner;
        admin = _admin;
        lockPeriod = _lockPeriod;
        tokenAddress = _tokenAddress;
        startTime = block.timestamp;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function depositEther() external payable override {
        require(tokenAddress == address(0), "Not ETH savings");
    }

    function depositToken(address token, uint amount) external override {
        require(tokenAddress == token, "Wrong token");
        IERC20(token).transferFrom(msg.sender, address(this), amount);
    }

    function withdraw() external override onlyOwner {
        uint fee;
        if (block.timestamp < startTime + lockPeriod) {
            fee = getBalance() * 3 / 100;
        }

        if (tokenAddress == address(0)) {
            uint amount = address(this).balance - fee;
            if (fee > 0) payable(admin).transfer(fee);
            payable(owner).transfer(amount);
        } else {
            uint balance = IERC20(tokenAddress).balanceOf(address(this));
            uint amount = balance - fee;
            if (fee > 0) IERC20(tokenAddress).transfer(admin, fee);
            IERC20(tokenAddress).transfer(owner, amount);
        }
    }

    function getBalance() public view override returns (uint) {
        if (tokenAddress == address(0)) {
            return address(this).balance;
        } else {
            return IERC20(tokenAddress).balanceOf(address(this));
        }
    }
}
