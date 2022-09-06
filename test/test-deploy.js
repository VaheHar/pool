const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Pool", function () {
  async function deployPoolFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const Stable = await ethers.getContractFactory("Stable");
    const stable = await Stable.deploy();

    const PoolToken = await ethers.getContractFactory("PoolToken");
    const poolToken = await PoolToken.deploy();

    const Pool = await ethers.getContractFactory("Pool");
    const pool = await Pool.deploy(stable.address, poolToken.address);

    poolToken.grantMinter(pool.address);

    await stable.mint(owner.address, 1000);
    await stable.mint(addr1.address, 2000);
    await stable.mint(addr2.address, 3000);

    return { pool, stable, poolToken, owner, addr1, addr2 };
  }

  describe("Deployment", function () {
    it("Should have the right stable address", async function () {
      const { pool, stable, poolToken, owner, addr1, addr2 } =
        await loadFixture(deployPoolFixture);

      expect(await pool.stable()).to.equal(stable.address);
    });
    it("Should have the right pool token address", async function () {
      const { pool, stable, poolToken, owner, addr1, addr2 } =
        await loadFixture(deployPoolFixture);

      expect(await pool.pToken()).to.equal(poolToken.address);
    });
  });

  describe("Deposit", function () {
    it("Should be able to deposit", async function () {
      const { pool, stable, poolToken, owner, addr1, addr2 } =
        await loadFixture(deployPoolFixture);
      await stable.approve(pool.address, 1000);
      await pool.deposit(1000, stable.address);

      expect(await stable.balanceOf(owner.address)).to.equal(0);
      expect(await stable.balanceOf(pool.address)).to.equal(1000);
      expect(await poolToken.balanceOf(owner.address)).to.equal(100);
    });
  });
  describe("Withdrawing", function () {
    it("Should be able to withdraw", async function () {
      const { pool, stable, poolToken, owner, addr1, addr2 } =
        await loadFixture(deployPoolFixture);
      await stable.approve(pool.address, 1000);
      await pool.deposit(1000, stable.address);

      await stable.connect(addr1).approve(pool.address, 2000);
      await pool.connect(addr1).deposit(2000, stable.address);

      await stable.connect(addr2).approve(pool.address, 3000);
      await pool.connect(addr2).deposit(3000, stable.address);

      await stable.mint(pool.address, 10000);
      await pool.withdraw(1000);
      expect(await stable.balanceOf(owner.address)).to.equal(1250);

      await pool.connect(addr1).withdraw(2000);
      expect(await stable.balanceOf(addr1.address)).to.equal(2500);

      await pool.connect(addr2).withdraw(3000);
      expect(await stable.balanceOf(addr2.address)).to.equal(3750);
    });
  });
});
