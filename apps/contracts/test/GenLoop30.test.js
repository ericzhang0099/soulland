const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GenLoop 3.0 Core Contracts", function () {
  let identityNFT, instructorNFT, evolutionNFT, agcToken, genLoopCore;
  let owner, user1, user2, certifier;

  beforeEach(async function () {
    [owner, user1, user2, certifier] = await ethers.getSigners();

    // 部署合约
    const IdentityNFT = await ethers.getContractFactory("IdentityNFT");
    identityNFT = await IdentityNFT.deploy();

    const InstructorNFT = await ethers.getContractFactory("InstructorNFT");
    instructorNFT = await InstructorNFT.deploy();

    const EvolutionNFT = await ethers.getContractFactory("EvolutionNFT");
    evolutionNFT = await EvolutionNFT.deploy();

    const AGCToken = await ethers.getContractFactory("AGCToken");
    agcToken = await AGCToken.deploy(await identityNFT.getAddress());

    const GenLoop30Core = await ethers.getContractFactory("GenLoop30Core");
    genLoopCore = await GenLoop30Core.deploy(
      owner.address, // geneToken
      owner.address, // geneRegistry
      owner.address, // geneExchange
      await identityNFT.getAddress(),
      await instructorNFT.getAddress(),
      await evolutionNFT.getAddress(),
      await agcToken.getAddress()
    );

    // 授权
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
  });

  describe("IdentityNFT", function () {
    it("Should mint identity NFT with correct level", async function () {
      await genLoopCore.registerUser();
      
      const identity = await identityNFT.getIdentity(owner.address);
      expect(identity.level).to.equal(1); // DaoZu (first user)
      expect(identity.entryRank).to.equal(1);
    });

    it("Should assign levels based on entry order", async function () {
      // User1 enters first
      await identityNFT.connect(user1).mintIdentity(user1.address);
      let identity1 = await identityNFT.getIdentity(user1.address);
      expect(identity1.level).to.equal(1); // DaoZu

      // User2 enters second
      await identityNFT.connect(user1).mintIdentity(user2.address);
      let identity2 = await identityNFT.getIdentity(user2.address);
      expect(identity2.level).to.equal(1); // DaoZu (still in first 10000)
    });

    it("Should upgrade level when contribution threshold reached", async function () {
      await genLoopCore.registerUser();
      
      // Update contribution to trigger upgrade
      await identityNFT.updateContribution(owner.address, 10001);
      
      const identity = await identityNFT.getIdentity(owner.address);
      expect(identity.level).to.equal(2); // Upgraded to DaLuo
    });
  });

  describe("InstructorNFT", function () {
    it("Should certify instructor with start NFT", async function () {
      await genLoopCore.certifyInstructor(user1.address, "coding");
      
      const record = await instructorNFT.instructors(user1.address);
      expect(record.status).to.equal(1); // Active
      expect(record.field).to.equal("coding");
      
      expect(await instructorNFT.isActiveInstructor(user1.address)).to.be.true;
    });

    it("Should retire instructor with end NFT", async function () {
      await genLoopCore.certifyInstructor(user1.address, "coding");
      await instructorNFT.retireInstructor(user1.address, "No longer leading");
      
      const record = await instructorNFT.instructors(user1.address);
      expect(record.status).to.equal(2); // Retired
    });
  });

  describe("EvolutionNFT", function () {
    it("Should certify evolution with correct level", async function () {
      await genLoopCore.recordEvolution(
        user1.address,
        0, // Training
        1, // Basic level
        "Python",
        60, // beforeScore
        85  // afterScore
      );
      
      const count = await evolutionNFT.getAgentEvolutionCount(user1.address);
      expect(count).to.equal(1);
      
      const proof = await evolutionNFT.evolutionProofs(1);
      expect(proof.agent).to.equal(user1.address);
      expect(proof.level).to.equal(1); // Basic
      expect(proof.skillName).to.equal("Python");
    });

    it("Should track highest evolution level", async function () {
      // Basic evolution
      await genLoopCore.recordEvolution(user1.address, 0, 1, "Skill1", 50, 70);
      
      // Expert evolution
      await genLoopCore.recordEvolution(user1.address, 4, 3, "Skill2", 70, 95);
      
      const highestLevel = await evolutionNFT.getAgentHighestLevel(user1.address);
      expect(highestLevel).to.equal(3); // Expert
    });
  });

  describe("AGCToken", function () {
    it("Should mint AGC to user", async function () {
      await genLoopCore.registerUser();
      
      const balance = await agcToken.balanceOf(owner.address);
      expect(balance).to.equal(ethers.parseEther("1000"));
    });

    it("Should process transaction with 90/10 split", async function () {
      // Mint AGC to user1
      await agcToken.mint(user1.address, ethers.parseEther("1000"));
      
      const initialBalance = await agcToken.balanceOf(user1.address);
      expect(initialBalance).to.equal(ethers.parseEther("1000"));
      
      // Process transaction: user1 buys from user2 for 100 AGC
      await agcToken.connect(user1).approve(await agcToken.getAddress(), ethers.parseEther("100"));
      await agcToken.processTransaction(user1.address, user2.address, ethers.parseEther("100"));
      
      // User1 should have 900 AGC (1000 - 100)
      const user1Balance = await agcToken.balanceOf(user1.address);
      expect(user1Balance).to.equal(ethers.parseEther("900"));
      
      // User2 should have 90 AGC (90% of 100)
      const user2Balance = await agcToken.balanceOf(user2.address);
      expect(user2Balance).to.equal(ethers.parseEther("90"));
      
      // Platform pool should have 10 AGC (10% of 100)
      const platformPool = await agcToken.platformPool();
      expect(platformPool).to.equal(ethers.parseEther("10"));
    });

    it("Should deduct platform fee for recommendation", async function () {
      await agcToken.mint(user1.address, ethers.parseEther("100"));
      
      await agcToken.platformDeduct(user1.address, ethers.parseEther("10"), "Recommendation");
      
      const balance = await agcToken.balanceOf(user1.address);
      expect(balance).to.equal(ethers.parseEther("90"));
      
      const platformPool = await agcToken.platformPool();
      expect(platformPool).to.equal(ethers.parseEther("10"));
    });
  });

  describe("GenLoop30Core Integration", function () {
    it("Should register user with identity and AGC", async function () {
      await genLoopCore.registerUser();
      
      const info = await genLoopCore.getUserInfo(owner.address);
      expect(info.identity.level).to.equal(1);
      expect(info.agcBalance).to.equal(ethers.parseEther("1000"));
    });

    it("Should get complete user info", async function () {
      await genLoopCore.registerUser();
      await genLoopCore.certifyInstructor(owner.address, "coding");
      await genLoopCore.recordEvolution(owner.address, 0, 1, "Python", 60, 85);
      
      const info = await genLoopCore.getUserInfo(owner.address);
      
      expect(info.identity.level).to.equal(1);
      expect(info.agcBalance).to.equal(ethers.parseEther("1000"));
      expect(info.isInstructor).to.be.true;
      expect(info.evolutionCount).to.equal(1);
    });
  });
});
