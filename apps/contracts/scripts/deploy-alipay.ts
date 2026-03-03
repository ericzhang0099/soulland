import { ethers } from "hardhat";
import { writeFileSync } from "fs";
import { join } from "path";

/**
 * 部署支付宝支付合约
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("部署账户:", deployer.address);

  // 1. 部署 GenLoopPoints（如果尚未部署）
  console.log("\n1. 部署 GenLoopPoints...");
  const GenLoopPoints = await ethers.getContractFactory("GenLoopPoints");
  const pointsToken = await GenLoopPoints.deploy();
  await pointsToken.waitForDeployment();
  const pointsAddress = await pointsToken.getAddress();
  console.log("GenLoopPoints 部署地址:", pointsAddress);

  // 2. 部署 AlipayPaymentHandler
  console.log("\n2. 部署 AlipayPaymentHandler...");
  const exchangeRate = ethers.parseUnits("10", 18); // 1元 = 10 GLP
  
  const AlipayPaymentHandler = await ethers.getContractFactory("AlipayPaymentHandler");
  const alipayHandler = await AlipayPaymentHandler.deploy(pointsAddress, exchangeRate);
  await alipayHandler.waitForDeployment();
  const alipayAddress = await alipayHandler.getAddress();
  console.log("AlipayPaymentHandler 部署地址:", alipayAddress);

  // 3. 配置权限
  console.log("\n3. 配置权限...");
  
  // 给支付宝处理器铸造权限
  await pointsToken.grantRole(
    await pointsToken.MINTER_ROLE(),
    alipayAddress
  );
  console.log("已授予 AlipayPaymentHandler 铸造权限");

  // 4. 保存部署信息
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    contracts: {
      genLoopPoints: pointsAddress,
      alipayPaymentHandler: alipayAddress,
    },
    timestamp: new Date().toISOString(),
  };

  const deploymentPath = join(__dirname, "../deployments", `alipay-${deploymentInfo.network}.json`);
  writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n部署信息已保存到:", deploymentPath);

  // 5. 输出配置信息
  console.log("\n========== 配置信息 ==========");
  console.log(`NEXT_PUBLIC_ALIPAY_CONTRACT_ADDRESS=${alipayAddress}`);
  console.log(`ALIPAY_CONTRACT_ADDRESS=${alipayAddress}`);
  console.log(`POINTS_TOKEN_ADDRESS=${pointsAddress}`);
  console.log("==============================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
