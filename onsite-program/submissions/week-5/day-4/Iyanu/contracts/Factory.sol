// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./multisig.sol"; 


contract MultiSigWalletFactory {
   
    event WalletCreated(
        address indexed walletAddress,
        address indexed creator,
        address[] owners,
        uint256 timestamp
    );
    event WalletRegistered(address indexed walletAddress, string name);

    address[] public deployedWallets;
    mapping(address => bool) public isDeployedWallet;
    mapping(address => address[]) public userWallets; // user => wallet addresses
    mapping(address => WalletInfo) public walletInfo;
    
    struct WalletInfo {
        string name;
        address creator;
        address[] owners;
        uint256 createdAt;
        bool isActive;
    }

    modifier onlyValidWallet(address _wallet) {
        require(isDeployedWallet[_wallet], "Wallet not deployed by this factory");
        _;
    }

   
    function createWallet(
        address[] memory _owners,
        string memory _name
    ) external returns (address walletAddress) {
        require(_owners.length >= 3, "Minimum 3 owners required");
        require(bytes(_name).length > 0, "Wallet name cannot be empty");
        
        for (uint256 i = 0; i < _owners.length; i++) {
            require(_owners[i] != address(0), "Invalid owner address");
            
            for (uint256 j = i + 1; j < _owners.length; j++) {
                require(_owners[i] != _owners[j], "Duplicate owner address");
            }
        }

        MultiSigWallet newWallet = new MultiSigWallet(_owners);
        walletAddress = address(newWallet);

        deployedWallets.push(walletAddress);
        isDeployedWallet[walletAddress] = true;

        walletInfo[walletAddress] = WalletInfo({
            name: _name,
            creator: msg.sender,
            owners: _owners,
            createdAt: block.timestamp,
            isActive: true
        });

        for (uint256 i = 0; i < _owners.length; i++) {
            userWallets[_owners[i]].push(walletAddress);
        }

        emit WalletCreated(walletAddress, msg.sender, _owners, block.timestamp);
        emit WalletRegistered(walletAddress, _name);

        return walletAddress;
    }

    
    function createWalletWithSalt(
        address[] memory _owners,
        string memory _name,
        bytes32 _salt
    ) external returns (address walletAddress) {
        require(_owners.length >= 3, "Minimum 3 owners required");
        require(bytes(_name).length > 0, "Wallet name cannot be empty");

        for (uint256 i = 0; i < _owners.length; i++) {
            require(_owners[i] != address(0), "Invalid owner address");
            for (uint256 j = i + 1; j < _owners.length; j++) {
                require(_owners[i] != _owners[j], "Duplicate owner address");
            }
        }

        bytes memory bytecode = abi.encodePacked(
            type(MultiSigWallet).creationCode,
            abi.encode(_owners)
        );
        
        assembly {
            walletAddress := create2(0, add(bytecode, 0x20), mload(bytecode), _salt)
        }
        
        require(walletAddress != address(0), "Failed to deploy wallet");

        deployedWallets.push(walletAddress);
        isDeployedWallet[walletAddress] = true;

        walletInfo[walletAddress] = WalletInfo({
            name: _name,
            creator: msg.sender,
            owners: _owners,
            createdAt: block.timestamp,
            isActive: true
        });

        for (uint256 i = 0; i < _owners.length; i++) {
            userWallets[_owners[i]].push(walletAddress);
        }

        emit WalletCreated(walletAddress, msg.sender, _owners, block.timestamp);
        emit WalletRegistered(walletAddress, _name);

        return walletAddress;
    }

    
    function predictWalletAddress(
        address[] memory _owners,
        bytes32 _salt
    ) external view returns (address predicted) {
        bytes memory bytecode = abi.encodePacked(
            type(MultiSigWallet).creationCode,
            abi.encode(_owners)
        );
        
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                _salt,
                keccak256(bytecode)
            )
        );
        
        return address(uint160(uint256(hash)));
    }

   
    function updateWalletName(
        address _wallet,
        string memory _newName
    ) external onlyValidWallet(_wallet) {
        require(
            walletInfo[_wallet].creator == msg.sender,
            "Only creator can update name"
        );
        require(bytes(_newName).length > 0, "Name cannot be empty");
        
        walletInfo[_wallet].name = _newName;
        emit WalletRegistered(_wallet, _newName);
    }

    function deactivateWallet(address _wallet) external onlyValidWallet(_wallet) {
        require(
            walletInfo[_wallet].creator == msg.sender,
            "Only creator can deactivate"
        );
        walletInfo[_wallet].isActive = false;
    }

    
    function getDeployedWallets() external view returns (address[] memory) {
        return deployedWallets;
    }

    
    function getUserWallets(address _user) external view returns (address[] memory) {
        return userWallets[_user];
    }

    function getActiveUserWallets(address _user) external view returns (address[] memory activeWallets) {
        address[] memory allWallets = userWallets[_user];
        uint256 activeCount = 0;
        
        for (uint256 i = 0; i < allWallets.length; i++) {
            if (walletInfo[allWallets[i]].isActive) {
                activeCount++;
            }
        }
        
        activeWallets = new address[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allWallets.length; i++) {
            if (walletInfo[allWallets[i]].isActive) {
                activeWallets[index] = allWallets[i];
                index++;
            }
        }
        
        return activeWallets;
    }

  
    function getWalletInfo(address _wallet) external view returns (WalletInfo memory info) {
        require(isDeployedWallet[_wallet], "Wallet not found");
        return walletInfo[_wallet];
    }

 
    function getTotalWallets() external view returns (uint256) {
        return deployedWallets.length;
    }

    
    function getWalletDetails(address _wallet)
        external
        view
        onlyValidWallet(_wallet)
        returns (
            string memory name,
            address creator,
            address[] memory owners,
            uint256 balance,
            uint256 transactionCount,
            bool isActive
        )
    {
        WalletInfo memory info = walletInfo[_wallet];
        MultiSigWallet wallet = MultiSigWallet(payable(_wallet));
        
        return (
            info.name,
            info.creator,
            info.owners,
            wallet.getBalance(),
            wallet.getTransactionCount(),
            info.isActive
        );
    }

  
     
    function isFactoryWallet(address _wallet) external view returns (bool) {
        return isDeployedWallet[_wallet];
    }
}