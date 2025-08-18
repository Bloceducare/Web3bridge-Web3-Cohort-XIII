import { ethers } from "hardhat";
const helpers = require ("@nomicfoundation/hardhat-network-helpers");

async function name() {
    const address = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";
    const DAIaddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    const WETHaddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    await helpers.impersonateAccount(address);
    const Assetholder = await ethers.getSigner(address);

    const DAI = await ethers.getContractAt("IERC20", DAIaddress);
    const WETH = await ethers.getContractAt("IERC20", WETHaddress);
    const UNI_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
    const IROUTER = await ethers.getContractAt("IUniswapV2Router01", UNI_ROUTER)
    const FACTORYaddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
    const FACTORY = await ethers.getContractAt("IUniswapV2Factory", FACTORYaddress);

    console.log 
    ("---------MAINNET FORKING STARTED--------");
    console.log 
    ("---------GET TOKEN BALANCES OF ASSETHOLDER--------");
    
    const initialDAIBalance = await DAI.balanceOf(Assetholder);
    
    console.log ("InitialDAIbalance", ethers.formatUnits(initialDAIBalance.toString(), 18));

    console.log("");

 

    const DAIamount = ethers.parseUnits("400000" ,18);
    const ApprovedDAI = await DAI.connect(Assetholder).approve(IROUTER,DAIamount);

    const DAItx = await ApprovedDAI.wait();
    
    console.log("######RECEIPT OF TRANSACTION######");
    console.log("DAI Transaction Receipt:", DAItx!.hash);
    console.log ("");
    const deadline = Math.floor(Date.now()/1000)+ 60 * 10;

    
  const provideLiquidity = await IROUTER.connect(Assetholder).addLiquidityETH(
    DAIaddress,
    DAIamount,
    1,
    1,
    Assetholder,
    deadline,
    {value: ethers.parseEther("1200")}
  );

  const Liquiditytx = await provideLiquidity.wait();
  console.log("#########Liquidity Added Receipt#######");
  console.log ("liquidity Added Successfully", Liquiditytx!.hash);
  console.log ("");
  console.log ("---------ASSETHOLDER BALANCES UPDATED AFTER ADDING LIQUIDITY--------");
  const updatedDAIBalance = await DAI.balanceOf(Assetholder);

  console.log ("Current DAI Balance:", ethers.formatUnits(updatedDAIBalance.toString(), 18));
  console.log ("Current ETH Balance:", ethers.formatEther(await ethers.provider.getBalance(Assetholder)));

  console.log ("");

    const POOL_ADDRESS = await FACTORY.connect(Assetholder).getPair(DAIaddress, WETHaddress);
  console.log ("Pool Address:", POOL_ADDRESS);

  const UNI_ETH_POOL = await ethers.getContractAt("IUniswapV2Pair", POOL_ADDRESS);
  const LP_TOKEN  = await UNI_ETH_POOL.balanceOf(Assetholder);
  await UNI_ETH_POOL.connect(Assetholder).approve(IROUTER, LP_TOKEN);
  

  const removeLiquidity = await IROUTER.connect(Assetholder).removeLiquidityETH(
    DAIaddress,
    LP_TOKEN,
    1,
    1,
    Assetholder,
    deadline,
  )

  const removeLiquidityTx = await removeLiquidity.wait();
  console.log("#########Liquidity Removed Receipt#######");
  console.log("Remove Liquidity Transaction Receipt:", removeLiquidityTx!.hash);
  console.log ("");
  console.log ("---------ASSETHOLDER BALANCES UPDATED AFTER REMOVING LIQUIDITY--------");
  const finalDAIBalance = await DAI.balanceOf(Assetholder);
  const finalETHBalance = await ethers.provider.getBalance(Assetholder);
  console.log ("Current DAI Balance:", ethers.formatUnits(finalDAIBalance.toString(), 18));
  console.log ("Current ETH Balance:", ethers.formatEther(finalETHBalance));
}
    

name().catch((error) => {
    console.error(error);
    process.exit(1);
  });