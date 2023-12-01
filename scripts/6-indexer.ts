import { ethers } from "hardhat";

async function deployIndexer(eas:string) {
    const [deployer] = await ethers.getSigners();
    console.log('Deploying Registry Schema contract with account:',deployer.address);

   const Indexer = await ethers.getContractFactory("Indexer",deployer);
   const indexer = await Indexer.deploy(eas);
    
    const addr =  await indexer.getAddress();
    console.log('Indexer contract address:', addr )
} 

export default deployIndexer;