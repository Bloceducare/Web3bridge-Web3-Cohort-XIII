// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.28;

contract ParticipantNFT {
    string public constant NAME = "DAO Participant Token";
    string public constant SYMBOL = "DPT";
    address public immutable registry;
    uint256 private _tokenIdCounter;

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(address => uint256[]) private _ownedTokens;

    event NFTMinted(address indexed owner, uint256 indexed tokenId);
    event NFTTransferred(address indexed from, address indexed to, uint256 indexed tokenId);

    constructor(address _registry) {
        require(_registry != address(0), "Invalid registry address");
        registry = _registry;
    }

    function balanceOf(address owner) external view returns (uint256) {
        require(owner != address(0), "Query for zero address");
        return _balances[owner];
    }

    function ownerOf(uint256 tokenId) external view returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "Token does not exist");
        return owner;
    }

    function transferFrom(address from, address to, uint256 tokenId) external {
        require(msg.sender == registry, "Only registry can transfer");
        require(_owners[tokenId] == from, "Not token owner");
        require(to != address(0), "Transfer to zero address");
        _balances[from]--;
        _balances[to]++;
        _owners[tokenId] = to;
        _updateOwnedTokens(from, to, tokenId);
        emit NFTTransferred(from, to, tokenId);
    }

    function mint(address to) external returns (uint256) {
        require(msg.sender == registry, "Only registry can mint");
        require(to != address(0), "Mint to zero address");
        uint256 tokenId = _tokenIdCounter++;
        _balances[to]++;
        _owners[tokenId] = to;
        _ownedTokens[to].push(tokenId);
        emit NFTMinted(to, tokenId);
        return tokenId;
    }

    // Helper function to get all tokens owned by an address
    function getOwnedTokens(address owner) external view returns (uint256[] memory) {
        return _ownedTokens[owner];
    }

   
    function _updateOwnedTokens(address from, address to, uint256 tokenId) private {
        uint256[] storage fromTokens = _ownedTokens[from];
        for (uint256 i = 0; i < fromTokens.length; i++) {
            if (fromTokens[i] == tokenId) {
                fromTokens[i] = fromTokens[fromTokens.length - 1];
                fromTokens.pop();
                break;
            }
        }
        _ownedTokens[to].push(tokenId);
    }
}