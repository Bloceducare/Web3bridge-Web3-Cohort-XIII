constructor(address initialOwner) ERC721("MyNFT", "MNFT") Ownable(initialOwner) {
    _tokenIdCounter = 0;
}

function safeMint(address to, string memory tokenURI) public onlyOwner {
    uint256 tokenId = _tokenIdCounter;
    _tokenIdCounter++;
    _safeMint(to, tokenId);
    _setTokenURI(tokenId, tokenURI);
}

function getCurrentTokenId() public view returns (uint256) {
    return _tokenIdCounter;
}