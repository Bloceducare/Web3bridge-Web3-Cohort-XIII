// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";

contract PermitSwapScript is Script {
    bytes32 public constant PERMIT_TYPEHASH = keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
    bytes32 public constant DOMAIN_TYPEHASH = keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    
    address constant UNISWAP_V2_ROUTER = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address constant WETH_WHALE = 0x06920c9Fc643DE77B99cb7670a944AD31EaA6e53;
    
    function run() external {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        
        vm.deal(WETH_WHALE, 100 ether);
        vm.startPrank(WETH_WHALE);
        
        IWETH9(WETH).deposit{value: 10 ether}();
        uint256 whaleWethBalance = IERC20(WETH).balanceOf(WETH_WHALE);
        
        if (whaleWethBalance == 0) return;
        
        uint256 amountIn = whaleWethBalance < 0.1 ether ? whaleWethBalance : 0.1 ether;
        uint256 deadline = block.timestamp + 3600;
        
        bytes32 domainSeparator = getDomainSeparator(WETH);
        bytes32 structHash = getPermitHash(WETH_WHALE, address(0), amountIn, 0, deadline);
        bytes32 hash = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, hash);
        
        IERC20Permit(WETH).permit(WETH_WHALE, address(0), amountIn, deadline, v, r, s);
        IERC20(WETH).transferFrom(WETH_WHALE, address(0), amountIn);
        IERC20(WETH).approve(UNISWAP_V2_ROUTER, amountIn);
        
        address[] memory path = new address[](2);
        path[0] = WETH;
        path[1] = DAI;
        
        uint256[] memory amounts = IUniswapV2Router(UNISWAP_V2_ROUTER).swapExactTokensForTokens(
            amountIn,
            0,
            path,
            WETH_WHALE,
            block.timestamp + 1800
        );
        
        vm.stopPrank();
        
        console.log("Swap completed:", amounts[amounts.length - 1]);
    }
    
    function getDomainSeparator(address token) public view returns (bytes32) {
        return keccak256(abi.encode(
            DOMAIN_TYPEHASH,
            keccak256(bytes("Wrapped Ether")),
            keccak256(bytes("1")),
            block.chainid,
            token
        ));
    }
    
    function getPermitHash(
        address owner,
        address spender,
        uint256 value,
        uint256 nonce,
        uint256 deadline
    ) public pure returns (bytes32) {
        return keccak256(abi.encode(
            PERMIT_TYPEHASH,
            owner,
            spender,
            value,
            nonce,
            deadline
        ));
    }
}

interface IWETH9 {
    function deposit() external payable;
    function withdraw(uint256 wad) external;
}

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
}

interface IERC20Permit {
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;
}

interface IUniswapV2Router {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
}