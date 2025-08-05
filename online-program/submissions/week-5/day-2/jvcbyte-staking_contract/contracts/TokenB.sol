// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract TokenB {
    error StakingContractAlreadySet();
    error InvalidStakingAddress();

    string public name = "Token B";
    string public symbol = "TKB";
    uint8 public decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    address public stakingContract;
    bool private stakingContractSet;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    modifier onlyStaking() {
        require(msg.sender == stakingContract, "Only staking contract");
        _;
    }

    function setStakingContract(address _stakingContract) external returns (bool) {
        if (stakingContractSet) revert StakingContractAlreadySet();
        if (_stakingContract == address(0)) revert InvalidStakingAddress();

        stakingContract = _stakingContract;
        stakingContractSet = true;
        
        return true;
    }

    function mint(address to, uint256 amount) external onlyStaking {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function burn(address from, uint256 amount) external onlyStaking {
        require(balanceOf[from] >= amount, "Insufficient balance");
        totalSupply -= amount;
        balanceOf[from] -= amount;
        emit Transfer(from, address(0), amount);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool) {
        require(
            allowance[from][msg.sender] >= amount,
            "Insufficient allowance"
        );
        require(balanceOf[from] >= amount, "Insufficient balance");

        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;

        emit Transfer(from, to, amount);
        return true;
    }
}
