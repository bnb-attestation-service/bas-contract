import { ethers } from "hardhat";

import deployRegistry from "./1-registrySchema";
import deployEAS from "./2-eas";
import initSchema from "./3-initSchema";
import initSchemaName from "./4-initName";
import deployEIP712 from "./5-eip721";
import deployIndexer from "./6-indexer";


async function main() {
  // const registrySchema = await deployRegistry();
  // const eas = await deployEAS(registrySchema);
  // const registrySchema = "0x65CFBDf1EA0ACb7492Ecc1610cfBf79665DC631B" as string
  const eas = "0x5e905F77f59491F03eBB78c204986aaDEB0C6bDa" as string
  // await initSchema(registrySchema);
  // await initSchemaName(eas);
  await deployEIP712(eas);
  // await deployIndexer(eas);
}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
