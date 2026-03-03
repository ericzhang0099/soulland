import { run, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// 颜色输出
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

function log(message: string, type: "info" | "success" | "warning" | "error" = "info") {
  const color = {
    info: colors.cyan,
    success: colors.green,
    warning: colors.yellow,
    error: colors.red,
  }[type];
  console.log(`${color}${colors.bright}[${type.toUpperCase()}]${colors.reset} ${message}`);
}

interface ContractInfo {
  address: string;
  constructorArgs?: any[];
  verified?: boolean;
}

interface DeploymentData {
  network: string;
  contracts: Record<string, ContractInfo>;
}

async function main() {
  const networkName = network.name;

  log(`🔍 开始验证 ${networkName} 网络上的合约`, "info");

  // 读取部署记录
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const latestFile = path.join(deploymentsDir, `${networkName}-latest.json`);

  if (!fs.existsSync(latestFile)) {
    log(`❌ 未找到 ${networkName} 的部署记录`, "error");
    log(`请确保文件存在: ${latestFile}`, "error");
    process.exit(1);
  }

  const deployment: DeploymentData = JSON.parse(fs.readFileSync(latestFile, "utf-8"));

  log(`✅ 找到部署记录，网络: ${deployment.network}`, "success");

  // 等待一段时间确保合约已在区块链上可见
  log("等待 15 秒以确保合约可被验证...", "info");
  await new Promise((resolve) => setTimeout(resolve, 15000));

  const contractsToVerify = Object.entries(deployment.contracts).filter(
    ([_, contract]) => contract && !contract.verified
  );

  if (contractsToVerify.length === 0) {
    log("✅ 所有合约已经验证完成", "success");
    return;
  }

  log(`需要验证 ${contractsToVerify.length} 个合约`, "info");

  for (const [name, contract] of contractsToVerify) {
    try {
      log(`\n验证 ${name}...`, "info");
      log(`地址: ${contract.address}`, "info");

      const verifyArgs: any = {
        address: contract.address,
        constructorArguments: contract.constructorArgs || [],
      };

      await run("verify:verify", verifyArgs);

      contract.verified = true;
      log(`✅ ${name} 验证成功!`, "success");
    } catch (error: any) {
      if (error.message.includes("Already Verified")) {
        log(`⚠️ ${name} 已经验证过`, "warning");
        contract.verified = true;
      } else if (error.message.includes("does not have bytecode")) {
        log(`❌ ${name} 该地址没有字节码，可能尚未部署或地址错误`, "error");
      } else {
        log(`❌ ${name} 验证失败: ${error.message}`, "error");
      }
    }

    // 更新部署记录
    fs.writeFileSync(latestFile, JSON.stringify(deployment, null, 2));
  }

  // 验证摘要
  log("\n========================================", "info");
  log("验证完成摘要", "info");
  log("========================================", "info");

  const allContracts = Object.entries(deployment.contracts);
  const verifiedCount = allContracts.filter(([_, c]) => c?.verified).length;

  console.log(`\n总合约数: ${allContracts.length}`);
  console.log(`已验证: ${verifiedCount}`);
  console.log(`待验证: ${allContracts.length - verifiedCount}`);

  console.log("\n验证状态:");
  for (const [name, contract] of allContracts) {
    const status = contract?.verified ? "✅ 已验证" : "❌ 未验证";
    console.log(`  ${name}: ${status}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
