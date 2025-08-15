// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces/IChronoStamp.sol";
import "./libraries/ChronoStampLib.sol";
import "./errors/ChronoStampErrors.sol";

interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

contract ChronoStamp is IChronoStamp, IERC165 {
    using ChronoStampLib for *;

    string public constant name = "Chrono Stamp";
    string public constant symbol = "CSTAMP";

    uint256 private _tokenIdCounter;
    address private _owner;
    uint256 public constant MAX_SUPPLY = 1000;

    mapping (uint256 => address) private _owners;
    mapping (address => uint256) private _balances;
    mapping (uint256 => address) private _tokenApprovals;
    mapping (address => mapping(address => bool)) private _operatorApprovals;
    mapping (uint256 => uint256) private _mintTimestamps;

    string private constant _baseImageURI = "https://emerald-mad-whippet-73.mypinata.cloud/ipfs/bafkreiezk4gum5f5clozlvfg4ghrma6jy4dtgfvc3fbzap2im2hqr64p5e";

    bytes4 private constant _INTERFACE_ID_ERC721 = 0x80ac58cd;
    bytes4 private constant _INTERFACE_ID_ERC721_METADATA = 0x5b5e139f;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    constructor() {
        _owner = msg.sender;
    }

    modifier onlyOwner() {
        if (msg.sender != _owner) revert ChronoStampErrors.NotOwner();
        _;
    }

    function supportsInterface(bytes4 interfaceId) external pure override returns (bool) {
        return interfaceId == _INTERFACE_ID_ERC721 || interfaceId == _INTERFACE_ID_ERC721_METADATA;
    }

    function balanceOf(address owner_) external view returns (uint256) {
        if (owner_ == address(0)) revert ChronoStampErrors.InvalidAddress();
        return _balances[owner_];
    }

    function ownerOf(uint256 tokenId) external view returns (address) {
        address owner_ = _owners[tokenId];
        if (owner_ == address(0)) revert ChronoStampErrors.NonexistentToken();
        return owner_;
    }

    function approve(address to, uint256 tokenId) external {
        address owner_ = _owners[tokenId];
        if (owner_ == address(0)) revert ChronoStampErrors.NonexistentToken();
        if (msg.sender != owner_ && !_operatorApprovals[owner_][msg.sender]) revert ChronoStampErrors.NotOwner();
        _tokenApprovals[tokenId] = to;
        emit Approval(owner_, to, tokenId);
    }

    function getApproved(uint256 tokenId) external view returns (address) {
        if (_owners[tokenId] == address(0)) revert ChronoStampErrors.NonexistentToken();
        return _tokenApprovals[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) external {
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address owner_, address operator) external view returns (bool) {
        return _operatorApprovals[owner_][operator];
    }

    function transferFrom(address from, address to, uint256 tokenId) public {
        address owner_ = _owners[tokenId];
        if (owner_ == address(0)) revert ChronoStampErrors.NonexistentToken();
        if (owner_ != from) revert ChronoStampErrors.NotOwner();
        if (msg.sender != owner_ && msg.sender != _tokenApprovals[tokenId] && !_operatorApprovals[owner_][msg.sender]) {
            revert ChronoStampErrors.NotOwner();
        }
        if (to == address(0)) revert ChronoStampErrors.InvalidAddress();

        
        delete _tokenApprovals[tokenId];

        _balances[from]--;
        _balances[to]++;

        _owners[tokenId] = to;

        emit Transfer(from, to, tokenId);
    }

    // NOW TO MINT
    function mintToken(address to) external onlyOwner returns (uint256) {
        if (to == address(0)) revert ChronoStampErrors.InvalidAddress();
        if (_tokenIdCounter >= MAX_SUPPLY) revert ChronoStampErrors.MaxSupplyReached();

        _tokenIdCounter++;
        uint256 newId = _tokenIdCounter;

        _owners[newId] = to;
        _balances[to]++;
        _mintTimestamps[newId] = block.timestamp;

        emit Transfer(address(0), to, newId);
        return newId;
    }

    function tokenTimestamp(uint256 tokenId) external view returns (uint256) {
        if (_owners[tokenId] == address(0)) revert ChronoStampErrors.NonexistentToken();
        return _mintTimestamps[tokenId];
    }

    // METADATA
    function tokenURI(uint256 tokenId) public view returns (string memory) {
        if (_owners[tokenId] == address(0)) revert ChronoStampErrors.NonexistentToken();

        string memory timeStr = ChronoStampLib.formatTime(block.timestamp);
        string memory svg = string(
            abi.encodePacked(
                "<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'>",
                "<rect width='100%' height='100%' fill='#000' />",
                "<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' ",
                "style='font-family:monospace;font-size:48px;fill:#ffffff'>",
                timeStr,
                "</text></svg>"
            )
        );
        string memory svgBase64 = ChronoStampLib.base64Encode(bytes(svg));

        string memory json = string(
            abi.encodePacked(
                '{"name":"Chrono Stamp #', ChronoStampLib.toString(tokenId), '",',
                '"description":"Dynamic on-chain SVG displaying current chain time (UTC).",',
                '"image":"data:image/svg+xml;base64,', svgBase64, '"}'
            )
        );

        string memory jsonBase64 = ChronoStampLib.base64Encode(bytes(json));
        return string(abi.encodePacked("data:application/json;base64,", jsonBase64));
    }
}
