// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import "./interface/IERC20.sol";

contract PiggyBank {
    address admin;
    bool lock = true;
    address[] allERC20;
    mapping(address contractAddress => bool present) isContractAddressPresent;

    enum Currency {
        ETHER,
        ERC20
    }

    struct AccountDetails {
        address owner;
        uint256 lockPeriod;
    }

    AccountDetails accountDetails;

    receive() external payable {}

    constructor(address _owner, uint256 _duration, address _admin) {
        accountDetails = AccountDetails(_owner, _duration + block.timestamp);
        admin = _admin;
    }

    function getEtherBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getERC20Balance(
        address _contractAddress
    ) external view returns (uint256) {
        return IERC20(_contractAddress).balanceOf(address(this));
    }

    function withdraw(
        address _contractAddress,
        uint256 _amount
    )
        external
        OnlyOwner
        isLock
        hasSufficientBalance(_contractAddress, _amount)
    {
        // lock = block.timestamp < accountDetails.lockPeriod;
       

        if (_contractAddress == address(0)) {
            (bool callSuccess, ) = payable(accountDetails.owner).call{
                value: _amount
            }("");
            require(callSuccess, "Transfer failed");
        } else {
            IERC20(_contractAddress).transfer(accountDetails.owner, _amount);
        }
    }

    function deposit(address _contractAddress, uint256 _amount) external payable {
      
        if (_contractAddress == address(0)){
           
        } else {
            
              require(
            IERC20(_contractAddress).balanceOf(msg.sender) > _amount,
            "you do not have enough balnce"
        );

            IERC20(_contractAddress).transferFrom(
            msg.sender,
            address(this),
            _amount
        );
        if (!isContractAddressPresent[_contractAddress]) {
            allERC20.push(_contractAddress);
            isContractAddressPresent[_contractAddress] = true;
        }
        }

        
    }

    // function deposit() external payable {}

    function unlock(address _contractAddress) external OnlyOwner {
        uint256 unlockFee = (IERC20(_contractAddress).balanceOf(address(this)) *
            3) / 100;

        IERC20(_contractAddress).transfer(admin, unlockFee);
        lock = false;
    }

    function getAllTokenAddress() external view returns (address[] memory) {
        return allERC20;
    }

    modifier hasSufficientBalance(address token, uint256 amount) {
        if (token == address(0)) {
            require(
                address(this).balance >= amount,
                "Withdrawal amount exceeds ETH balance"
            );
        } else {
            require(
                IERC20(token).balanceOf(address(this)) >= amount,
                "Withdrawal amount exceeds token balance"
            );
        }
        _;
    }

    modifier isLock() {
        require(!lock || block.timestamp >= accountDetails.lockPeriod, "funds are still locked");
        _;
    }

    modifier OnlyOwner() {
        require(
            msg.sender == accountDetails.owner,
            "only owner can use this function"
        );
        _;
    }
}
