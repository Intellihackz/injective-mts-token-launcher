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
    console.log("  - Users pay 2 INJ total to create tokens");
    console.log("  - 1 INJ platform fee + 1 INJ for bank module registration");
    console.log("  - Owner can withdraw accumulated INJ platform fees");
    console.log("\n📝 To create a token, users must:");
    console.log("  - Call createToken() with 2 INJ value (msg.value)");
    console.log(`\n💡 Verify contract: npx hardhat verify --network inj_testnet ${factoryAddress}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
