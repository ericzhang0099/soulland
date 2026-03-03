import { expect } from "chai";
import { ethers } from "hardhat";

describe("GenLoop Contracts", function () {
  let geneToken: any, geneRegistry: any, paymentHandler: any;
  let geneExchange: any, geneMerging: any;
  let owner: any, addr1: any, addr2: any;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const GeneToken = await ethers.getContractFactory("GeneToken");
    geneToken = await GeneToken.deploy();

    const PaymentHandler = await ethers.getContractFactory("PaymentHandler");
    paymentHandler = await PaymentHandler.deploy(owner.address, owner.address);

    const GeneRegistry = await ethers.getContractFactory("GeneRegistry");
    geneRegistry = await GeneRegistry.deploy();

    const GeneExchange = await ethers.getContractFactory("GeneExchange");
    geneExchange = await GeneExchange.deploy(
      await geneToken.getAddress(),
      await paymentHandler.getAddress()
    );

    const GeneMerging = await ethers.getContractFactory("GeneMerging");
    geneMerging = await GeneMerging.deploy(
      await geneToken.getAddress(),
      await geneRegistry.getAddress(),
      await paymentHandler.getAddress(),
      await geneExchange.getAddress(),
      1000
    );

    // Grant roles
    await geneToken.grantRole(await geneToken.MINTER_ROLE(), await geneRegistry.getAddress());
    await geneRegistry.grantRole(await geneRegistry.REGISTRAR_ROLE(), await geneMerging.getAddress());
  });

  describe("GeneToken", function () {
    it("Should mint a gene", async function () {
      await geneToken.mintGene(addr1.address, 1, "ipfs://test");
      expect(await geneToken.ownerOf(1)).to.equal(addr1.address);
    });
  });

  describe("GeneRegistry", function () {
    it("Should register a gene", async function () {
      const tx = await geneRegistry.registerGene(
        addr1.address,
        0, // Ability
        5000,
        ethers.keccak256(ethers.toUtf8Bytes("dna1"))
      );
      await tx.wait();
      
      const gene = await geneRegistry.getGene(1);
      expect(gene.creator).to.equal(addr1.address);
      expect(gene.rarityScore).to.equal(5000);
    });
  });

  describe("GeneExchange", function () {
    it("Should create collection order", async function () {
      await geneToken.mintGene(addr1.address, 1, "ipfs://test");
      await geneToken.connect(addr1).approve(await geneExchange.getAddress(), 1);
      
      await geneExchange.connect(addr1).createCollectionOrder(1, ethers.parseEther("0.1"), ethers.ZeroAddress);
      
      const order = await geneExchange.orders(1);
      expect(order.seller).to.equal(addr1.address);
      expect(order.price).to.equal(ethers.parseEther("0.1"));
    });
  });
});
