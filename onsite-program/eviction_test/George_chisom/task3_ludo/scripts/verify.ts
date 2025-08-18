import { run } from "hardhat";

async function main() {
  const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS || "";
  const GAME_ADDRESS = process.env.GAME_ADDRESS || "";
  const INITIAL_SUPPLY = 1000000;

  if (!TOKEN_ADDRESS || !GAME_ADDRESS) {
    console.error("Please set TOKEN_ADDRESS and GAME_ADDRESS environment variables");
    return;
  }

  console.log("Verifying contracts...");

  try {
    await run("verify:verify", {
      address: TOKEN_ADDRESS,
      constructorArguments: [INITIAL_SUPPLY],
    });
    console.log("LudoToken verified successfully");
  } catch (error) {
    console.log("LudoToken verification failed:", error);
  }

  try {
    await run("verify:verify", {
      address: GAME_ADDRESS,
      constructorArguments: [TOKEN_ADDRESS],
    });
    console.log("LudoGame verified successfully");
  } catch (error) {
    console.log("LudoGame verification failed:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
