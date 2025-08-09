// scripts/verify.js
async function main() {
    const contractAddress = "0xB213e20957402EcCe0A5a2A9f09A7d62aC3fe772";
    const owners = [
      "0xAA6E05A031f9EE46311A61d3C65a646f7392b4fa",
      "0x2eC6be1A02b8697367f95082e94c3789b917E22A",
      "0x4B359D10c05b8615B437AA76bD4A5aEef4FdDE9F",
    ];
    const confirmations = 2;
  
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [owners, confirmations],
    });
  }
  
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
  