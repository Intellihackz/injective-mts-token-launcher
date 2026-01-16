const hre = require("hardhat");

async function main() {
    console.log("Deploying TokenFactory...\n");

    const TokenFactory = await hre.ethers.getContractFactory("TokenFactory");
    const factory = await TokenFactory.deploy();

    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();
    const [deployer] = await hre.ethers.getSigners();

    console.log("✅ TokenFactory deployed successfully!");
    console.log(`  Contract Address: ${factoryAddress}`);
    console.log(`  Owner (you): ${deployer.address}`);
    console.log("\n📋 Factory Features:");
    console.log("  - Users pay 1 wINJ fee to create tokens");
    console.log("  - Users send 1 INJ for bank module registration");
    console.log("  - Owner can withdraw accumulated wINJ fees");
    console.log("\n📝 To create a token, users must:");
    console.log("  1. Approve factory to spend 1 wINJ");
    console.log("  2. Call createToken() with 1 INJ value");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
