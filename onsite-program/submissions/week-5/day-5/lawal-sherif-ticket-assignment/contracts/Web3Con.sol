// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

struct User {
    string name;
    address walletAddress;
    bool isRegistered;
}

contract Web3ConToken is ERC20 {
    address public systemContract;
    
    constructor(address _systemContract) ERC20("Web3ConToken", "W3C") {
        systemContract = _systemContract;
    }
    
    function mint(address to, uint256 amount) external {
        require(msg.sender == systemContract, "Only system contract can mint");
        _mint(to, amount);
    }
}

contract Web3ConSystem is ERC721, Ownable {
    Web3ConToken public token;
    uint256 public nextTokenId;
    
    uint256 public constant REGISTRATION_REWARD = 100_000 * 10**18;
    uint256 public constant NFT_COST = 10_000 * 10**18;
    
    string public constant baseURL = "https://bronze-ready-tarsier-679.mypinata.cloud/ipfs/";
    string public constant metadataFolderCID = "bafybeiaeml3capus4fkpiy52tmve27es4vclvttakftxj5bapvlsjuxina";

    mapping(address => User) public users;

    constructor() ERC721("Web3ConNFT", "W3CNFT") Ownable(msg.sender) {
        token = new Web3ConToken(address(this));
    }

    function registerUser(string memory _name) external {
        require(!users[msg.sender].isRegistered, "User already registered");
        require(bytes(_name).length > 0, "Name cannot be empty");
        
        users[msg.sender] = User({
            name: _name,
            walletAddress: msg.sender,
            isRegistered: true
        });
        
        token.mint(msg.sender, REGISTRATION_REWARD);
    }

    function mintNFT() external {
        require(users[msg.sender].isRegistered, "User must be registered first");
        require(token.balanceOf(msg.sender) >= NFT_COST, "Insufficient tokens");
        
        token.transferFrom(msg.sender, address(this), NFT_COST);
        
        uint256 tokenId = nextTokenId;
        _mint(msg.sender, tokenId);
        nextTokenId++;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");

        return string(abi.encodePacked(
            baseURL,
            metadataFolderCID,
            "/",
            Strings.toString(tokenId),
            ".json"
        ));
    }

    function getUserInfo(address _user) external view returns (User memory) {
        return users[_user];
    }

    function getUserTokenBalance(address _user) external view returns (uint256) {
        return token.balanceOf(_user);
    }

    function isUserRegistered(address _user) external view returns (bool) {
        return users[_user].isRegistered;
    }

    function getTokenAddress() external view returns (address) {
        return address(token);
    }

    function hasApprovedTokens(address user) external view returns (bool) {
        return token.allowance(user, address(this)) >= NFT_COST;
    }

    function withdrawTokens() external onlyOwner {
        uint256 balance = token.balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        token.transfer(owner(), balance);
    }
}

