import { ethers } from "hardhat";

import deployRegistry from "./1-registrySchema";
import deployEAS from "./2-eas";
import initSchema from "./3-initSchema";
import initSchemaName from "./4-initName";
import deployEIP712 from "./5-eip721";
import deployIndexer from "./6-indexer";


async function main() {
  const registrySchema = await deployRegistry();
  const eas = await deployEAS(registrySchema);
  await initSchema(registrySchema);
  await initSchemaName(eas);
  await deployEIP712(eas);
  await deployIndexer(eas);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
