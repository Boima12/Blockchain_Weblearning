import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("CourseRegistry", function () {
  it("creates and updates courses", async function () {
    const [owner, alice, bob] = await ethers.getSigners();
    const registry = await ethers.deployContract("CourseRegistry");

    await expect(registry.connect(alice).createCourse("cid-1", 100n))
      .to.emit(registry, "CourseCreated")
      .withArgs(0n, alice.address, "cid-1", 100n);

    const course = await registry.courses(0n);
    expect(course.creator).to.equal(alice.address);
    expect(course.metadataCID).to.equal("cid-1");
    expect(course.priceWei).to.equal(100n);
    expect(course.active).to.equal(true);

    await expect(
      registry.connect(bob).updateCourse(0n, "cid-2", 200n, false),
    ).to.be.revertedWithCustomError(registry, "NotCreator");

    await expect(
      registry.connect(bob).createCourse("cid-1", 50n),
    ).to.be.revertedWithCustomError(registry, "DuplicateMetadata");

    await expect(registry.connect(alice).updateCourse(0n, "cid-2", 200n, false))
      .to.emit(registry, "CourseUpdated")
      .withArgs(0n, "cid-2", 200n, false);

    const updated = await registry.courses(0n);
    expect(updated.metadataCID).to.equal("cid-2");
    expect(updated.priceWei).to.equal(200n);
    expect(updated.active).to.equal(false);
  });
});

describe("CoursePurchase", function () {
  it("allows purchase and pays the creator", async function () {
    const [owner, alice, bob] = await ethers.getSigners();
    const registry = await ethers.deployContract("CourseRegistry");
    const purchase = await ethers.deployContract("CoursePurchase", [registry]);

    const price = ethers.parseEther("1");
    await registry.connect(alice).createCourse("cid-1", price);

    const before = await ethers.provider.getBalance(alice.address);
    await expect(purchase.connect(bob).buyCourse(0n, { value: price }))
      .to.emit(purchase, "CoursePurchased")
      .withArgs(0n, bob.address, alice.address, price);

    expect(await purchase.hasAccess(0n, bob.address)).to.equal(true);

    const after = await ethers.provider.getBalance(alice.address);
    expect(after - before).to.equal(price);
  });

  it("rejects wrong price and inactive courses", async function () {
    const [owner, alice, bob] = await ethers.getSigners();
    const registry = await ethers.deployContract("CourseRegistry");
    const purchase = await ethers.deployContract("CoursePurchase", [registry]);

    const price = ethers.parseEther("1");
    await registry.connect(alice).createCourse("cid-1", price);
    await registry.connect(alice).updateCourse(0n, "cid-1", price, false);

    await expect(
      purchase.connect(bob).buyCourse(0n, { value: price }),
    ).to.be.revertedWithCustomError(purchase, "CourseInactive");

    await registry.connect(alice).updateCourse(0n, "cid-1", price, true);

    await expect(
      purchase.connect(bob).buyCourse(0n, { value: price - 1n }),
    ).to.be.revertedWithCustomError(purchase, "WrongPrice");
  });

  it("rejects invalid registry updates", async function () {
    const registry = await ethers.deployContract("CourseRegistry");
    const purchase = await ethers.deployContract("CoursePurchase", [registry]);

    await expect(
      purchase.updateRegistry(ethers.ZeroAddress),
    ).to.be.revertedWithCustomError(purchase, "InvalidRegistry");
  });
});

describe("CertificateNFT", function () {
  it("mints soulbound certificates", async function () {
    const [owner, alice, bob] = await ethers.getSigners();
    const cert = await ethers.deployContract("CertificateNFT", [
      "Blockchain Weblearning Certificate",
      "BWL-CERT",
      owner.address,
    ]);

    const minterRole = await cert.MINTER_ROLE();
    await expect(
      cert.connect(bob).mintCertificate(bob.address, 1n, "ipfs://cid"),
    )
      .to.be.revertedWithCustomError(cert, "AccessControlUnauthorizedAccount")
      .withArgs(bob.address, minterRole);

    await expect(
      cert.connect(owner).mintCertificate(alice.address, 7n, "ipfs://cid"),
    )
      .to.emit(cert, "CertificateIssued")
      .withArgs(0n, 7n, alice.address, "ipfs://cid");

    await expect(
      cert.connect(owner).mintCertificate(ethers.ZeroAddress, 9n, "ipfs://cid"),
    ).to.be.revertedWithCustomError(cert, "InvalidStudent");

    await expect(
      cert.connect(alice).transferFrom(alice.address, bob.address, 0n),
    ).to.be.revertedWithCustomError(cert, "Soulbound");

    await expect(
      cert.connect(owner).mintCertificate(alice.address, 7n, "ipfs://cid-2"),
    ).to.be.revertedWithCustomError(cert, "AlreadyIssued");
  });
});
