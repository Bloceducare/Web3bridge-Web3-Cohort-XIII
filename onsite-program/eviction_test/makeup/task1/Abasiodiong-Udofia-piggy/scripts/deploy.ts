import { ethers } from "hardhat";

async function main() {
  const [owner, employee1, employee2] = await ethers.getSigners();
  const payrollAddress = "0x99D5e2B9486f44814792440de0AAC458b6CBeCAB";

    const NarutoChakraPayroll = await ethers.getContractFactory("NarutoChakraPayroll");
  const payroll = NarutoChakraPayroll.attach(payrollAddress) as any; 

  const salary = ethers.parseUnits("100", 6);
  await payroll.connect(owner).registerEmployee("Naruto Uzumaki", employee1.address, salary);
  await payroll.connect(owner).registerEmployee("Sasuke Uchiha", employee2.address, salary);
  console.log("Employees registered");

  
  let tokenAddress;
  try {
    tokenAddress = await payroll.payrollToken();
    console.log("Payroll token address:", tokenAddress);
  } catch (error) {
    console.error("Failed to retrieve payroll token address:", error);
    console.log("Using fallback token address (e.g., USDC on Mainnet): 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
    tokenAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; 
  }

  const token = await ethers.getContractAt("IERC20", tokenAddress);
  const fundAmount = ethers.parseUnits("1000", 6);
  
  await ethers.provider.send("hardhat_setBalance", [await payroll.getAddress(), ethers.parseEther("1").toString()]);
  console.log("Contract funded with mock balance");

  
  for (let i = 0; i < 5; i++) {
    await payroll.connect(employee1).checkIn(1);
    await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]); // Advance 1 day
    await ethers.provider.send("evm_mine", []);
  }
  console.log("Employee 1 checked in 5 times");

  
  const initialBalance = await token.balanceOf(employee1.address);
  await payroll.connect(employee1).requestPayout(1);
  const finalBalance = await token.balanceOf(employee1.address);
  console.log("Employee 1 payout completed. New balance:", ethers.formatUnits(finalBalance - initialBalance, 6));
}

main().catch((error) => {
  console.error("Error in execution:", error);
  process.exitCode = 1;
});