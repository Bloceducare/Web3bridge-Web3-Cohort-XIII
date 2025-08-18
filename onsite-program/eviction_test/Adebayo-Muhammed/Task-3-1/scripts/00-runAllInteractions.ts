import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function runScript(scriptName: string, description: string) {
  console.log(`RUNNING: ${description}`);

  try {
    const { stdout, stderr } = await execAsync(`npx hardhat run scripts/${scriptName} --network hardhat`);
    console.log(stdout);
    if (stderr) {
      console.error("Warnings:", stderr);
    }

    console.log("COMPLETED SUCCESSFULLY");
    console.log("Waiting 3 seconds before next interaction");
    await new Promise(resolve => setTimeout(resolve, 3000));

  } catch (error) {
    console.error(`ERROR in ${scriptName}:`, error);
    console.log("Continuing to next script");
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

async function main() {
  console.log("UNISWAP V2 CORE FUNCTIONS DEMO");

  const interactions = [
    {
      script: "01-swapExactTokensForTokens.ts",
      description: "SWAP EXACT TOKENS FOR TOKENS"
    },
    {
      script: "03-swapExactETHForTokens.ts",
      description: "SWAP EXACT ETH FOR TOKENS"
    },
    {
      script: "05-swapExactTokensForETH.ts",
      description: "SWAP EXACT TOKENS FOR ETH"
    },
    {
      script: "07-addLiquidityETH.ts",
      description: "ADD LIQUIDITY ETH"
    },
    {
      script: "09-removeLiquidityETH.ts",
      description: "REMOVE LIQUIDITY ETH"
    }
  ];

  console.log(`Total Interactions: ${interactions.length}`);

  for (let i = 0; i < interactions.length; i++) {
    const interaction = interactions[i];
    console.log(`[${i + 1}/${interactions.length}] Starting: ${interaction.description}`);

    await runScript(interaction.script, interaction.description);
  }

  console.log("ALL UNISWAP V2 CORE INTERACTIONS COMPLETED");
  console.log("Functions covered:");
  console.log("swapExactTokensForTokens");
  console.log("swapExactETHForTokens");
  console.log("swapExactTokensForETH");
  console.log("addLiquidityETH");
  console.log("removeLiquidityETH");
}

main().catch((error) => {
  console.error("Master script failed:", error);
  process.exitCode = 1;
});
