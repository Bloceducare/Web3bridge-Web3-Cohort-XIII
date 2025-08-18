// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/IUniswapV2Router02.sol";
import "./interfaces/IUniswapV2Factory.sol";
import "./interfaces/IUniswapV2Pair.sol";
import "./interfaces/IERC20.sol";

contract UniswapV2Interactions {
    IUniswapV2Router02 public immutable uniswapRouter;
    IUniswapV2Factory public immutable uniswapFactory;
    address public immutable WETH;

    event LiquidityAdded(
        address indexed tokenA,
        address indexed tokenB,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity,
        address indexed to
    );

    event LiquidityRemoved(
        address indexed tokenA,
        address indexed tokenB,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity,
        address indexed to
    );

    event TokensSwapped(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        address indexed to
    );

    event PairCreated(
        address indexed tokenA,
        address indexed tokenB,
        address indexed pair
    );

    error InsufficientBalance();
    error InsufficientAllowance();
    error InvalidTokenAddress();
    error InvalidAmount();
    error DeadlineExpired();
    error SlippageExceeded();

    modifier validDeadline(uint256 deadline) {
        if (deadline < block.timestamp) revert DeadlineExpired();
        _;
    }

    modifier validAmount(uint256 amount) {
        if (amount == 0) revert InvalidAmount();
        _;
    }

    constructor(address _router) {
        uniswapRouter = IUniswapV2Router02(_router);
        uniswapFactory = IUniswapV2Factory(uniswapRouter.factory());
        WETH = uniswapRouter.WETH();
    }

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external validDeadline(deadline) validAmount(amountADesired) validAmount(amountBDesired) {
        if (tokenA == address(0) || tokenB == address(0)) revert InvalidTokenAddress();

        IERC20(tokenA).transferFrom(msg.sender, address(this), amountADesired);
        IERC20(tokenB).transferFrom(msg.sender, address(this), amountBDesired);

        IERC20(tokenA).approve(address(uniswapRouter), amountADesired);
        IERC20(tokenB).approve(address(uniswapRouter), amountBDesired);

        (uint256 amountA, uint256 amountB, uint256 liquidity) = uniswapRouter.addLiquidity(
            tokenA,
            tokenB,
            amountADesired,
            amountBDesired,
            amountAMin,
            amountBMin,
            to,
            deadline
        );

        if (amountADesired > amountA) {
            IERC20(tokenA).transfer(msg.sender, amountADesired - amountA);
        }
        if (amountBDesired > amountB) {
            IERC20(tokenB).transfer(msg.sender, amountBDesired - amountB);
        }

        emit LiquidityAdded(tokenA, tokenB, amountA, amountB, liquidity, to);
    }

    function addLiquidityETH(
        address token,
        uint256 amountTokenDesired,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) external payable validDeadline(deadline) validAmount(amountTokenDesired) {
        if (token == address(0)) revert InvalidTokenAddress();
        if (msg.value == 0) revert InvalidAmount();

        IERC20(token).transferFrom(msg.sender, address(this), amountTokenDesired);
        IERC20(token).approve(address(uniswapRouter), amountTokenDesired);

        (uint256 amountToken, uint256 amountETH, uint256 liquidity) = uniswapRouter.addLiquidityETH{value: msg.value}(
            token,
            amountTokenDesired,
            amountTokenMin,
            amountETHMin,
            to,
            deadline
        );

        if (amountTokenDesired > amountToken) {
            IERC20(token).transfer(msg.sender, amountTokenDesired - amountToken);
        }
        if (msg.value > amountETH) {
            payable(msg.sender).transfer(msg.value - amountETH);
        }

        emit LiquidityAdded(token, WETH, amountToken, amountETH, liquidity, to);
    }

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external validDeadline(deadline) validAmount(liquidity) {
        if (tokenA == address(0) || tokenB == address(0)) revert InvalidTokenAddress();

        address pair = uniswapFactory.getPair(tokenA, tokenB);
        IERC20(pair).transferFrom(msg.sender, address(this), liquidity);
        IERC20(pair).approve(address(uniswapRouter), liquidity);

        (uint256 amountA, uint256 amountB) = uniswapRouter.removeLiquidity(
            tokenA,
            tokenB,
            liquidity,
            amountAMin,
            amountBMin,
            to,
            deadline
        );

        emit LiquidityRemoved(tokenA, tokenB, amountA, amountB, liquidity, to);
    }

    function removeLiquidityETH(
        address token,
        uint256 liquidity,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) external validDeadline(deadline) validAmount(liquidity) {
        if (token == address(0)) revert InvalidTokenAddress();

        address pair = uniswapFactory.getPair(token, WETH);
        IERC20(pair).transferFrom(msg.sender, address(this), liquidity);
        IERC20(pair).approve(address(uniswapRouter), liquidity);

        (uint256 amountToken, uint256 amountETH) = uniswapRouter.removeLiquidityETH(
            token,
            liquidity,
            amountTokenMin,
            amountETHMin,
            to,
            deadline
        );

        emit LiquidityRemoved(token, WETH, amountToken, amountETH, liquidity, to);
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external validDeadline(deadline) validAmount(amountIn) {
        if (path.length < 2) revert InvalidTokenAddress();

        IERC20(path[0]).transferFrom(msg.sender, address(this), amountIn);
        IERC20(path[0]).approve(address(uniswapRouter), amountIn);

        uint256[] memory amounts = uniswapRouter.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            to,
            deadline
        );

        emit TokensSwapped(path[0], path[path.length - 1], amounts[0], amounts[amounts.length - 1], to);
    }

    function swapTokensForExactTokens(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external validDeadline(deadline) validAmount(amountOut) {
        if (path.length < 2) revert InvalidTokenAddress();

        IERC20(path[0]).transferFrom(msg.sender, address(this), amountInMax);
        IERC20(path[0]).approve(address(uniswapRouter), amountInMax);

        uint256[] memory amounts = uniswapRouter.swapTokensForExactTokens(
            amountOut,
            amountInMax,
            path,
            to,
            deadline
        );

        uint256 actualAmountIn = amounts[0];
        if (amountInMax > actualAmountIn) {
            IERC20(path[0]).transfer(msg.sender, amountInMax - actualAmountIn);
        }

        emit TokensSwapped(path[0], path[path.length - 1], amounts[0], amounts[amounts.length - 1], to);
    }

    function swapExactETHForTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable validDeadline(deadline) {
        if (msg.value == 0) revert InvalidAmount();
        if (path.length < 2 || path[0] != WETH) revert InvalidTokenAddress();

        uint256[] memory amounts = uniswapRouter.swapExactETHForTokens{value: msg.value}(
            amountOutMin,
            path,
            to,
            deadline
        );

        emit TokensSwapped(path[0], path[path.length - 1], amounts[0], amounts[amounts.length - 1], to);
    }

    function swapTokensForExactETH(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external validDeadline(deadline) validAmount(amountOut) {
        if (path.length < 2 || path[path.length - 1] != WETH) revert InvalidTokenAddress();

        IERC20(path[0]).transferFrom(msg.sender, address(this), amountInMax);
        IERC20(path[0]).approve(address(uniswapRouter), amountInMax);

        uint256[] memory amounts = uniswapRouter.swapTokensForExactETH(
            amountOut,
            amountInMax,
            path,
            to,
            deadline
        );

        uint256 actualAmountIn = amounts[0];
        if (amountInMax > actualAmountIn) {
            IERC20(path[0]).transfer(msg.sender, amountInMax - actualAmountIn);
        }

        emit TokensSwapped(path[0], path[path.length - 1], amounts[0], amounts[amounts.length - 1], to);
    }

    function swapExactTokensForETH(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external validDeadline(deadline) validAmount(amountIn) {
        if (path.length < 2 || path[path.length - 1] != WETH) revert InvalidTokenAddress();

        IERC20(path[0]).transferFrom(msg.sender, address(this), amountIn);
        IERC20(path[0]).approve(address(uniswapRouter), amountIn);

        uint256[] memory amounts = uniswapRouter.swapExactTokensForETH(
            amountIn,
            amountOutMin,
            path,
            to,
            deadline
        );

        emit TokensSwapped(path[0], path[path.length - 1], amounts[0], amounts[amounts.length - 1], to);
    }

    function swapETHForExactTokens(
        uint256 amountOut,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable validDeadline(deadline) validAmount(amountOut) {
        if (msg.value == 0) revert InvalidAmount();
        if (path.length < 2 || path[0] != WETH) revert InvalidTokenAddress();

        uint256[] memory amounts = uniswapRouter.swapETHForExactTokens{value: msg.value}(
            amountOut,
            path,
            to,
            deadline
        );

        uint256 actualAmountIn = amounts[0];
        if (msg.value > actualAmountIn) {
            payable(msg.sender).transfer(msg.value - actualAmountIn);
        }

        emit TokensSwapped(path[0], path[path.length - 1], amounts[0], amounts[amounts.length - 1], to);
    }

    function getAmountsOut(uint256 amountIn, address[] calldata path)
        external
        view
        validAmount(amountIn)
        returns (uint256[] memory amounts)
    {
        if (path.length < 2) revert InvalidTokenAddress();
        return uniswapRouter.getAmountsOut(amountIn, path);
    }

    function getAmountsIn(uint256 amountOut, address[] calldata path)
        external
        view
        validAmount(amountOut)
        returns (uint256[] memory amounts)
    {
        if (path.length < 2) revert InvalidTokenAddress();
        return uniswapRouter.getAmountsIn(amountOut, path);
    }

    function quote(uint256 amountA, uint256 reserveA, uint256 reserveB)
        external
        view
        validAmount(amountA)
        returns (uint256 amountB)
    {
        return uniswapRouter.quote(amountA, reserveA, reserveB);
    }

    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut)
        external
        view
        validAmount(amountIn)
        returns (uint256 amountOut)
    {
        return uniswapRouter.getAmountOut(amountIn, reserveIn, reserveOut);
    }

    function getAmountIn(uint256 amountOut, uint256 reserveIn, uint256 reserveOut)
        external
        view
        validAmount(amountOut)
        returns (uint256 amountIn)
    {
        return uniswapRouter.getAmountIn(amountOut, reserveIn, reserveOut);
    }

    function getPair(address tokenA, address tokenB) external view returns (address pair) {
        if (tokenA == address(0) || tokenB == address(0)) revert InvalidTokenAddress();
        return uniswapFactory.getPair(tokenA, tokenB);
    }

    function getReserves(address tokenA, address tokenB)
        external
        view
        returns (uint112 reserveA, uint112 reserveB, uint32 blockTimestampLast)
    {
        if (tokenA == address(0) || tokenB == address(0)) revert InvalidTokenAddress();

        address pair = uniswapFactory.getPair(tokenA, tokenB);
        if (pair == address(0)) return (0, 0, 0);

        IUniswapV2Pair pairContract = IUniswapV2Pair(pair);
        (uint112 reserve0, uint112 reserve1, uint32 timestamp) = pairContract.getReserves();

        (address token0,) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        (reserveA, reserveB) = tokenA == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
        blockTimestampLast = timestamp;
    }

    function createPair(address tokenA, address tokenB) external returns (address pair) {
        if (tokenA == address(0) || tokenB == address(0)) revert InvalidTokenAddress();

        pair = uniswapFactory.createPair(tokenA, tokenB);
        emit PairCreated(tokenA, tokenB, pair);
    }

    function allPairsLength() external view returns (uint256 length) {
        return uniswapFactory.allPairsLength();
    }

    function allPairs(uint256 index) external view returns (address pair) {
        return uniswapFactory.allPairs(index);
    }

    function swapExactTokensForTokensSupportingFeeOnTransferTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external validDeadline(deadline) validAmount(amountIn) {
        if (path.length < 2) revert InvalidTokenAddress();

        IERC20(path[0]).transferFrom(msg.sender, address(this), amountIn);
        IERC20(path[0]).approve(address(uniswapRouter), amountIn);

        uniswapRouter.swapExactTokensForTokensSupportingFeeOnTransferTokens(
            amountIn,
            amountOutMin,
            path,
            to,
            deadline
        );

        emit TokensSwapped(path[0], path[path.length - 1], amountIn, 0, to);
    }

    function swapExactETHForTokensSupportingFeeOnTransferTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable validDeadline(deadline) {
        if (msg.value == 0) revert InvalidAmount();
        if (path.length < 2 || path[0] != WETH) revert InvalidTokenAddress();

        uniswapRouter.swapExactETHForTokensSupportingFeeOnTransferTokens{value: msg.value}(
            amountOutMin,
            path,
            to,
            deadline
        );

        emit TokensSwapped(path[0], path[path.length - 1], msg.value, 0, to);
    }

    function swapExactTokensForETHSupportingFeeOnTransferTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external validDeadline(deadline) validAmount(amountIn) {
        if (path.length < 2 || path[path.length - 1] != WETH) revert InvalidTokenAddress();

        IERC20(path[0]).transferFrom(msg.sender, address(this), amountIn);
        IERC20(path[0]).approve(address(uniswapRouter), amountIn);

        uniswapRouter.swapExactTokensForETHSupportingFeeOnTransferTokens(
            amountIn,
            amountOutMin,
            path,
            to,
            deadline
        );

        emit TokensSwapped(path[0], path[path.length - 1], amountIn, 0, to);
    }

    function recoverToken(address token, uint256 amount, address to) external {
        IERC20(token).transfer(to, amount);
    }

    function recoverETH(address payable to) external {
        to.transfer(address(this).balance);
    }

    function removeLiquidityWithPermit(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline,
        bool approveMax,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external validDeadline(deadline) validAmount(liquidity) returns (uint256 amountA, uint256 amountB) {
        if (tokenA == address(0) || tokenB == address(0)) revert InvalidTokenAddress();

        address pair = uniswapFactory.getPair(tokenA, tokenB);
        uint256 value = approveMax ? type(uint256).max : liquidity;

        IUniswapV2Pair(pair).permit(msg.sender, address(uniswapRouter), value, deadline, v, r, s);

        (amountA, amountB) = uniswapRouter.removeLiquidity(
            tokenA,
            tokenB,
            liquidity,
            amountAMin,
            amountBMin,
            to,
            deadline
        );

        emit LiquidityRemoved(tokenA, tokenB, amountA, amountB, liquidity, to);
    }

    function removeLiquidityETHWithPermit(
        address token,
        uint256 liquidity,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline,
        bool approveMax,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external validDeadline(deadline) validAmount(liquidity) returns (uint256 amountToken, uint256 amountETH) {
        if (token == address(0)) revert InvalidTokenAddress();

        address pair = uniswapFactory.getPair(token, WETH);
        uint256 value = approveMax ? type(uint256).max : liquidity;

        IUniswapV2Pair(pair).permit(msg.sender, address(uniswapRouter), value, deadline, v, r, s);

        (amountToken, amountETH) = uniswapRouter.removeLiquidityETH(
            token,
            liquidity,
            amountTokenMin,
            amountETHMin,
            to,
            deadline
        );

        emit LiquidityRemoved(token, WETH, amountToken, amountETH, liquidity, to);
    }

    function removeLiquidityETHSupportingFeeOnTransferTokens(
        address token,
        uint256 liquidity,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) external validDeadline(deadline) validAmount(liquidity) returns (uint256 amountETH) {
        if (token == address(0)) revert InvalidTokenAddress();

        address pair = uniswapFactory.getPair(token, WETH);
        IERC20(pair).transferFrom(msg.sender, address(this), liquidity);
        IERC20(pair).approve(address(uniswapRouter), liquidity);

        amountETH = uniswapRouter.removeLiquidityETHSupportingFeeOnTransferTokens(
            token,
            liquidity,
            amountTokenMin,
            amountETHMin,
            to,
            deadline
        );

        emit LiquidityRemoved(token, WETH, 0, amountETH, liquidity, to);
    }

    function removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(
        address token,
        uint256 liquidity,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline,
        bool approveMax,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external validDeadline(deadline) validAmount(liquidity) returns (uint256 amountETH) {
        if (token == address(0)) revert InvalidTokenAddress();

        address pair = uniswapFactory.getPair(token, WETH);
        uint256 value = approveMax ? type(uint256).max : liquidity;

        IUniswapV2Pair(pair).permit(msg.sender, address(uniswapRouter), value, deadline, v, r, s);

        amountETH = uniswapRouter.removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(
            token,
            liquidity,
            amountTokenMin,
            amountETHMin,
            to,
            deadline,
            approveMax,
            v,
            r,
            s
        );

        emit LiquidityRemoved(token, WETH, 0, amountETH, liquidity, to);
    }

    receive() external payable {}
}
