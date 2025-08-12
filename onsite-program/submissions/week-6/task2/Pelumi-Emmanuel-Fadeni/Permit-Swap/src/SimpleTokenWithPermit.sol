// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SimpleTokenWithPermit
 * @notice A simple ERC20 token with EIP-2612 permit functionality
 * 
 * This contract creates a token that supports off-chain signatures
 * for approvals, eliminating the need for separate approve transactions
 */
contract SimpleTokenWithPermit {
    // Basic token information
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    uint256 public totalSupply;
    
    // Track how many tokens each address has
    mapping(address => uint256) public balanceOf;
    
    // Track who is allowed to spend someone else's tokens
    // allowance[owner][spender] = amount
    mapping(address => mapping(address => uint256)) public allowance;
    
    // Track nonces to prevent replay attacks
    // A nonce is like a ticket number - each signature needs a new number
    mapping(address => uint256) public nonces;
    
    // EIP-712 Domain Separator - creates a unique "fingerprint" for our contract
    bytes32 public DOMAIN_SEPARATOR;
    
    // This is the "format" of our permit message
    bytes32 public constant PERMIT_TYPEHASH = 
        keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
    
    // Events - these are like announcements the blockchain makes
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    /**c
     * @notice Constructor - runs once when contract is deployed
     * @param _name The name of the token (e.g., "My Token")
     * @param _symbol The symbol of the token (e.g., "MTK")  
     * @param _totalSupply Initial supply of tokens to create
     */
    constructor(string memory _name, string memory _symbol, uint256 _totalSupply) {
        name = _name;
        symbol = _symbol;
        totalSupply = _totalSupply;
        
        // Give all initial tokens to the contract deployer
        balanceOf[msg.sender] = _totalSupply;
        
        // Set up the EIP-712 domain separator
        // This prevents signatures from being reused on other contracts
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes(name)),
                keccak256(bytes("1")),          // Version
                block.chainid,                   // Current blockchain ID
                address(this)                    // This contract's address
            )
        );
    }
    
    /**
     * @notice Transfer tokens to another address
     * @param to The address to send tokens to
     * @param amount The amount of tokens to send
     */
    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    /**
     * @notice Approve someone to spend your tokens (OLD WAY)
     * @param spender The address that can spend your tokens
     * @param amount The amount they can spend
     */
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    /**
     * @notice Transfer tokens from one address to another (if approved)
     * @param from The address to send tokens from
     * @param to The address to send tokens to  
     * @param amount The amount of tokens to send
     */
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        // Check if we're allowed to spend this person's tokens
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            allowance[from][msg.sender] = allowed - amount;
        }
        
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
    
    /**
     * @notice The magic permit function (NEW WAY)
     * 
     * Instead of calling approve(), someone can sign a message off-chain
     * and submit it here to approve spending
     * 
     * @param owner The person who owns the tokens
     * @param spender The person who wants to spend the tokens  
     * @param value How many tokens to approve
     * @param deadline When this permit expires
     * @param v Part of the signature
     * @param r Part of the signature  
     * @param s Part of the signature
     */
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        // Make sure the permit hasn't expired
        require(deadline >= block.timestamp, "PERMIT_DEADLINE_EXPIRED");
        
        // Create the message that was signed
        // This reconstructs the "document" that was signed
        bytes32 structHash = keccak256(
            abi.encode(
                PERMIT_TYPEHASH,
                owner,
                spender,
                value,
                nonces[owner]++,    // Use current nonce and increment it
                deadline
            )
        );
        
        // Add our domain separator to prevent replay attacks
        bytes32 hash = keccak256(
            abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash)
        );
        
        // Check who actually signed this message
        address signer = ecrecover(hash, v, r, s);
        
        // Make sure it was signed by the token owner
        require(signer != address(0) && signer == owner, "INVALID_SIGNER");
        
        // If everything checks out, approve the spending
        allowance[owner][spender] = value;
        emit Approval(owner, spender, value);
    }
    
    /**
     * @notice Create new tokens (for testing purposes)
     * @param to Address to send new tokens to
     * @param amount Amount of tokens to create
     */
    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
        emit Transfer(address(0), to, amount);
    }
}