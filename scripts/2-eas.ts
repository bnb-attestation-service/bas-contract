import {ethers} from "hardhat";

async function deployEAS(registrySchema:string) {
    const [deployer] = await ethers.getSigners();
    console.log('Depolying EAS contract with account:',deployer.address);

    
    const EAS = await ethers.getContractFactory("EAS");
    const eas = await EAS.deploy(registrySchema);
    
    const addr = await eas.getAddress();
    console.log('EAS address:', addr )
    return addr
} 

export default deployEAS;