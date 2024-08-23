import { ethers } from "hardhat";

async function main() {
  const eas = "0x5e905F77f59491F03eBB78c204986aaDEB0C6bDa" as string
  // await initSchema(registrySchema);
  // await initSchemaName(eas);

  const [deployer] = await ethers.getSigners();
  console.log('deploy account:',deployer.address);

  const BASToken  = await ethers.getContractFactory("TargetToken",deployer);
  const basToken = await BASToken.deploy(); 
  const addr = basToken.getAddress();
  await basToken.waitForDeployment();
  console.log('bas contract address:', addr)

  const Resolver = await ethers.getContractFactory("contracts/BASResolver.sol:PayingResolver",deployer);
  const resolver = await Resolver.deploy(
        eas,
        1_000_000_000,
        1_000_000_000,
        addr
  );  

  const raddr = resolver.getAddress();
  await resolver.waitForDeployment();
  console.log('resolver contract address:', raddr)
}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
