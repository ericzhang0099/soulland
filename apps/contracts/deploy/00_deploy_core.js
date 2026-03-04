const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // 1. 部署 IdentityNFT
  console.log("\n1. Deploying IdentityNFT...");
  const IdentityNFT = await ethers.getContractFactory("IdentityNFT");
  const identityNFT = await IdentityNFT.deploy();
  await identityNFT.waitForDeployment();
  console.log("IdentityNFT deployed to:", await identityNFT.getAddress());

  // 2. 部署 InstructorNFT
  console.log("\n2. Deploying InstructorNFT...");
  const InstructorNFT = await ethers.getContractFactory("InstructorNFT");
  const instructorNFT = await InstructorNFT.deploy();
  await instructorNFT.waitForDeployment();
  console.log("InstructorNFT deployed to:", await instructorNFT.getAddress());

  // 3. 部署 EvolutionNFT
  console.log("\n3. Deploying EvolutionNFT...");
  const EvolutionNFT = await ethers.getContractFactory("EvolutionNFT");
  const evolutionNFT = await EvolutionNFT.deploy();
  await evolutionNFT.waitForDeployment();
  console.log("EvolutionNFT deployed to:", await evolutionNFT.getAddress());

  // 4. 部署 AGCToken（传入IdentityNFT地址）
  console.log("\n4. Deploying AGCToken...");
  const AGCToken = await ethers.getContractFactory("AGCToken");
  const agcToken = await AGCToken.deploy(await identityNFT.getAddress());
  await agcToken.waitForDeployment();
  console.log("AGCToken deployed to:", await agcToken.getAddress());

  // 5. 部署 GenLoop30Core（集成所有合约）
  console.log("\n5. Deploying GenLoop30Core...");
  const GenLoop30Core = await ethers.getContractFactory("GenLoop30Core");
  
  // 使用2.0已有合约地址（或部署新合约）
  const geneTokenAddress = process.env.GENE_TOKEN_ADDRESS || deployer.address;
  const geneRegistryAddress = process.env.GENE_REGISTRY_ADDRESS || deployer.address;
  const geneExchangeAddress = process.env.GENE_EXCHANGE_ADDRESS || deployer.address;
  
  const genLoopCore = await GenLoop30Core.deploy(
    geneTokenAddress,
    geneRegistryAddress,
    geneExchangeAddress,
    await identityNFT.getAddress(),
    await instructorNFT.getAddress(),
    await evolutionNFT.getAddress(),
    await agcToken.getAddress()
  );
  await genLoopCore.waitForDeployment();
  console.log("GenLoop30Core deployed to:", await genLoopCore.getAddress());

  // 6. 配置权限
  console.log("\n6. Configuring permissions...");
  
  // 给GenLoop30Core授权
  await identityNFT.grantRole(
    await identityNFT.LEVEL_MANAGER_ROLE(),
    await genLoopCore.getAddress()
  );
  
  await instructorNFT.grantRole(
    await instructorNFT.CERTIFIER_ROLE(),
    await genLoopCore.getAddress()
  );
  
  await evolutionNFT.grantRole(
    await evolutionNFT.ISSUER_ROLE(),
    await genLoopCore.getAddress()
  );
  
  await agcToken.grantRole(
    await agcToken.MINTER_ROLE(),
    await genLoopCore.getAddress()
  );
  
  await agcToken.grantRole(
    await agcToken.PLATFORM_ROLE(),
    await genLoopCore.getAddress()
  );

  console.log("\n✅ All contracts deployed and configured!");
  
  // 输出部署信息
  console.log("\n=== Deployment Summary ===");
  console.log("IdentityNFT:", await identityNFT.getAddress());
  console.log("InstructorNFT:", await instructorNFT.getAddress());
  console.log("EvolutionNFT:", await evolutionNFT.getAddress());
  console.log("AGCToken:", await agcToken.getAddress());
  console.log("GenLoop30Core:", await genLoopCore.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
