import { ethers } from "hardhat";

 async function deployRegistry(){
    const [deployer] = await ethers.getSigners();

    // console.log('Depolying Registry Schema contract with account:',deployer.address);
    const registrySchema = await ethers.deployContract("SchemaRegistry")
    
    const addr = await registrySchema.getAddress();
    console.log('Registry Schema address:', addr)
    return addr
} 

export default deployRegistry;