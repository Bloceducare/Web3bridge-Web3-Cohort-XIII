import { ethers } from "hardhat";
const helpers = require ("@nomicfoundation/hardhat-network-helpers");

async function name() {
    const address = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";
    const USDCaddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    const DAIaddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    const USDC_DAI_POOL_address = "0xAE461cA67B15dc8dc81CE7615e0320dA1A9aB8D5";

   const Assetholder = await ethers.getSigner(address);

   const USDC =await ethers.getContractAt("IERC20",USDCaddress);
    const DAI = await ethers.getContractAt("IERC20", DAIaddress);
    const POOL = await ethers.getContractAt("IUniswapV2Pair", USDC_DAI_POOL_address);

    const UNI_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
    const IROUTER = await ethers.getContractAt("UniswapV2Router01", UNI_ROUTER)

    console.log ("---------MAINNET FORKING STARTED--------");
    const initialUSDCBalance = await USDC.balanceOf(Assetholder );
    const initialDAIBalance = await DAI.balanceOf(Assetholder);
    const initialLPBalance = await POOL.balanceOf(Assetholder);
    
    console.log ("InitialUSDCBalance:", ethers.formatUnits(initialUSDCBalance.toString(), 6));
    console.log ("InitialDAIbalance", ethers.formatUnits(initialDAIBalance.toString(), 18));
    console.log ("InitialLPBalance:", ethers.formatUnits(initialLPBalance.toString(), 18));

    console.log("");

    const USDCamount = ethers.parseUnits("700000000", 6);
    const DAIamount = ethers.parseUnits("400000" ,18);

    const  ApprovedUSDC = await USDC.connect(Assetholder).approve(IROUTER,USDCamount);
    const ApprovedDAI = await DAI.connect(Assetholder).approve(IROUTER,DAIamount);

    const USDCtx = await ApprovedUSDC.wait();
    const DAItx = await ApprovedDAI.wait();
    
    console.log("######RECEIPT OF TRANSACTION######");
    console.log("USDC Transaction Receipt:", USDCtx!.hash);
    console.log("DAI Transaction Recipt:", DAItx!.hash);
    console.log ("");
    const deadline = Math.floor(Date.now()/1000)+ 60 * 10;

    
  const provideLiquidity = await IROUTER.connect(Assetholder).addLiquidity(
    USDCaddress,
    DAIaddress,
    USDCamount,
    DAIamount,
    1,
    1,
    Assetholder,
    deadline,
  );

  const Liquiditytx = await provideLiquidity.wait();
  console.log("#########Liquidity Added Receipt#######");
  console.log ("liquidity Added Successfully", Liquiditytx!.hash);
  console.log ("");
  console.log ("---------ASSETHOLDER BALANCES UPDATED--------");
  const updatedUSDCBalance = await USDC.balanceOf(Assetholder);
  const updatedDAIBalance = await DAI.balanceOf(Assetholder);
  const updatedLPBalance = await POOL.balanceOf(Assetholder);

  console.log ("Current USDC Balance:", ethers.formatUnits(updatedUSDCBalance.toString(), 6));
  console.log ("Current DAI Balance:", ethers.formatUnits(updatedDAIBalance.toString(), 18));
  console.log ("Current LP Balance:", ethers.formatUnits(updatedLPBalance.toString(), 18));

  const LP__AMOUNT = await POOL.balanceOf(Assetholder);
  const AMOUNT_TO_REMOVE = LP__AMOUNT/2n; // Remove 50% of the LP tokens
  await POOL.connect(Assetholder).approve(IROUTER, AMOUNT_TO_REMOVE);


  const removeLiquidity = await IROUTER.connect(Assetholder).removeLiquidity(
    USDCaddress,
    DAIaddress,
    AMOUNT_TO_REMOVE,
    1,
    1,
    Assetholder.address,
    deadline
  );

  const removeLiquidityTx = await removeLiquidity.wait();
  console.log("#########Liquidity Removed Receipt#######");
  console.log("Remove Liquidity Transaction Receipt:", removeLiquidityTx!.hash);
  console.log ("");
  console.log ("---------ASSETHOLDER BALANCES UPDATED--------");
  const finalUSDCBalance = await USDC.balanceOf(Assetholder);
  const finalDAIBalance = await DAI.balanceOf(Assetholder);
  const finalLPBalance = await POOL.balanceOf(Assetholder);

  console.log ("Final USDC Balance:", ethers.formatUnits(finalUSDCBalance.toString(), 6));
  console.log ("Final DAI Balance:", ethers.formatUnits(finalDAIBalance.toString(), 18));
  console.log ("Final LP Balance:", ethers.formatUnits(finalLPBalance.toString(), 18));





}
    

name().catch((error) => {
    console.error(error);
    process.exit(1);
  });