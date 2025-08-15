// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

// Using a custom implementation of Counters since it was removed in OpenZeppelin v5
library Counters {
    struct Counter {
        uint256 _value; // default: 0
    }

    function current(Counter storage counter) internal view returns (uint256) {
        return counter._value;
    }

    function increment(Counter storage counter) internal {
        unchecked {
            counter._value += 1;
        }
    }

    function decrement(Counter storage counter) internal {
        uint256 value = counter._value;
        require(value > 0, "Counter: decrement overflow");
        unchecked {
            counter._value = value - 1;
        }
    }

    function reset(Counter storage counter) internal {
        counter._value = 0;
    }
}

/**
 * @title DAOToken
 * @dev ERC721 token representing membership in the DAO with role-based access control
 */
contract DAOToken is ERC721, ERC721URIStorage, AccessControl {
    using Counters for Counters.Counter;
    
    // Role definitions
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    
    // Token counter
    Counters.Counter private _tokenIdCounter;
    
    // Override the supportsInterface function to include all parent interfaces
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    
    // Override _isApprovedOrOwner to use the internal function from ERC721
    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        require(_exists(tokenId), "Token does not exist");
        address owner = ownerOf(tokenId);
        return (spender == owner || 
                getApproved(tokenId) == spender || 
                isApprovedForAll(owner, spender));
    }
    
    // Override _exists to use the internal function from ERC721
    function _exists(uint256 tokenId) internal view returns (bool) {
        return tokenId > 0 && tokenId <= _tokenIdCounter.current();
    }
    
    // Base token URI
    string private _baseTokenURI;
    
    // Mapping from token ID to token URI
    mapping(uint256 => string) private _tokenURIs;
    
    // Events
    event TokenMinted(address indexed to, uint256 indexed tokenId);
    event TokenBurned(uint256 indexed tokenId);
    event TokenBurned(uint256 indexed tokenId);
    event TokenURIUpdated(uint256 indexed tokenId, string tokenURI);
    
    /**
     * @dev Constructor
     * @param name_ Name of the token
     * @param symbol_ Symbol of the token
     * @param baseTokenURI_ Base URI for token metadata
     * @param admin Address of the admin
     */
    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseTokenURI_,
        address admin
    ) ERC721(name_, symbol_) {
        _baseTokenURI = baseTokenURI_;
        
        // Set up roles
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(BURNER_ROLE, admin);
    }
    
    /**
     * @dev Mints a new token with the given URI to the specified address
     * @param to Address to mint the token to
     * @param tokenURI_ URI for the token's metadata
     * @return The ID of the newly minted token
     */
    function mint(address to, string memory tokenURI_) public onlyRole(MINTER_ROLE) returns (uint256) {
        uint256 newTokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _mint(to, newTokenId);
        _setTokenURI(newTokenId, tokenURI_);
        
        emit TokenMinted(to, newTokenId);
        return newTokenId;
    }
    
    /**
     * @dev Burns a token
     * @param tokenId ID of the token to burn
     */
    function burn(uint256 tokenId) public onlyRole(BURNER_ROLE) {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "Caller is not owner nor approved");
        
        // Clear token URI if it exists
        if (bytes(_tokenURIs[tokenId]).length != 0) {
            delete _tokenURIs[tokenId];
        }
        
        _burn(tokenId);
        
        emit TokenBurned(tokenId);
    }
    
    /**
     * @dev Set the token URI for a given token
     * @param tokenId ID of the token
     * @param newTokenURI URI for the token's metadata
     */
    function setTokenURI(uint256 tokenId, string memory newTokenURI) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_exists(tokenId), "Token does not exist");
        _setTokenURI(tokenId, newTokenURI);
        emit TokenURIUpdated(tokenId, newTokenURI);
    }
    
    /**
     * @dev Set the base token URI for all tokens
     * @param baseTokenURI Base URI for token metadata
     */
    function setBaseTokenURI(string memory baseTokenURI) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _baseTokenURI = baseTokenURI;
    }
    
    /**
     * @dev Get the token URI for a token
     * @param tokenId ID of the token
     * @return URI for the token's metadata
     */
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        
        string memory _tokenURI = _tokenURIs[tokenId];
        
        // If there is no token URI, use the base URI
        if (bytes(_tokenURI).length == 0) {
            return string(abi.encodePacked(_baseTokenURI, _toString(tokenId)));
        }
        
        return _tokenURI;
    }
    
    /**
     * @dev Check if the contract supports an interface
     * @param interfaceId ID of the interface to check
     * @return Whether the interface is supported
     */
    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        override(ERC721, ERC721URIStorage, AccessControl) 
        returns (bool) 
    {
        return super.supportsInterface(interfaceId);
    }
    
    /**
     * @dev Internal function to set the token URI for a token
     * @param tokenId ID of the token
     * @param tokenURI_ URI for the token's metadata
     */
    function _setTokenURI(uint256 tokenId, string memory tokenURI_) internal override(ERC721URIStorage) {
        require(_exists(tokenId), "Token does not exist");
        _tokenURIs[tokenId] = tokenURI_;
    }
    
    /**
     * @dev Internal function to convert a uint256 to a string
     * @param value Value to convert
     * @return String representation of the value
     */
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        
        uint256 temp = value;
        uint256 digits;
        
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        
        bytes memory buffer = new bytes(digits);
        
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        
        return string(buffer);
    }
}
