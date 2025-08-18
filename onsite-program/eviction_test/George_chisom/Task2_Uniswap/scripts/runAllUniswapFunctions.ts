import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function runScript(scriptName: string, description: string) {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`Running: ${description}`);
  console.log(`Script: ${scriptName}`);
  console.log(`${"=".repeat(80)}\n`);

  try {
    const { stdout, stderr } = await execAsync(
      `npx hardhat run scripts/${scriptName}`
    );
    console.log(stdout);
    if (stderr) {
      console.error("Stderr:", stderr);
    }
    console.log(` ${description} completed successfully`);
  } catch (error: any) {
    console.error(` ${description} failed:`, error.message);
  }

  // Wait 2 seconds between scripts
  await new Promise((resolve) => setTimeout(resolve, 2000));
}

async function main() {
  console.log("🚀 Starting Comprehensive Uniswap V2 Function Testing");
  console.log("📅 Date:", new Date().toISOString());
  console.log("🔗 Network: Ethereum Mainnet Fork");
  console.log();

  const scripts = [
    {
      file: "01_addLiquidity.ts",
      description: "Add Liquidity (USDC/DAI)",
    },
    {
      file: "02_removeLiquidity.ts",
      description: "Remove Liquidity (USDC/DAI)",
    },
    {
      file: "03_swapExactTokensForTokens.ts",
      description: "Swap Exact Tokens for Tokens (USDC → DAI)",
    },
    {
      file: "04_swapTokensForExactTokens.ts",
      description: "Swap Tokens for Exact Tokens (USDC → DAI)",
    },
    {
      file: "05_swapExactETHForTokens.ts",
      description: "Swap Exact ETH for Tokens (ETH → USDC)",
    },
    {
      file: "06_swapETHForExactTokens.ts",
      description: "Swap ETH for Exact Tokens (ETH → USDC)",
    },
    {
      file: "07_swapExactTokensForETH.ts",
      description: "Swap Exact Tokens for ETH (USDC → ETH)",
    },
    {
      file: "08_swapTokensForExactETH.ts",
      description: "Swap Tokens for Exact ETH (USDC → ETH)",
    },
    {
      file: "09_swapExactTokensForTokensSupportingFeeOnTransferTokens.ts",
      description: "Swap Exact Tokens for Tokens (Fee-on-Transfer Support)",
    },
    {
      file: "10_swapExactETHForTokensSupportingFeeOnTransferTokens.ts",
      description: "Swap Exact ETH for Tokens (Fee-on-Transfer Support)",
    },
    {
      file: "11_swapExactTokensForETHSupportingFeeOnTransferTokens.ts",
      description: "Swap Exact Tokens for ETH (Fee-on-Transfer Support)",
    },
    {
      file: "12_removeLiquidityETHSupportingFeeOnTransferTokens.ts",
      description: "Remove Liquidity ETH (Fee-on-Transfer Support)",
    },
    {
      file: "13_removeLiquidityWithPermit.ts",
      description: "Remove Liquidity with Permit (EIP-712 Signature)",
    },
    {
      file: "14_removeLiquidityETHWithPermit.ts",
      description: "Remove Liquidity ETH with Permit (EIP-712 Signature)",
    },
  ];

  console.log(`📋 Total scripts to run: ${scripts.length}\n`);

  for (let i = 0; i < scripts.length; i++) {
    const script = scripts[i];
    console.log(`\n📍 Progress: ${i + 1}/${scripts.length}`);
    await runScript(script.file, script.description);
  }

  console.log(`\n${"=".repeat(80)}`);
  console.log("🎉 All Uniswap V2 Function Tests Completed!");
  console.log(`📊 Total functions tested: ${scripts.length}`);
  console.log("📸 Screenshots should be taken for each function interaction");
  console.log("📁 Save screenshots in the screenshots/ directory");
  console.log(`${"=".repeat(80)}\n`);

  console.log("📋 Summary of Functions Tested:");
  scripts.forEach((script, index) => {
    console.log(`${index + 1}. ${script.description}`);
  });

  console.log("\n🔍 Next Steps:");
  console.log("1. Review all transaction outputs");
  console.log("2. Take screenshots of each function execution");
  console.log("3. Verify all functions executed successfully");
  console.log("4. Document any errors or issues encountered");
}

main().catch((error) => {
  console.error("❌ Master script failed:", error);
  process.exitCode = 1;
});
