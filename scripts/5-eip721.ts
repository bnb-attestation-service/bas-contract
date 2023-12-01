import { ethers } from "hardhat";
import {EIP712_PROXY_NAME} from "./utils";

async function deployEIP712(eas:string) {
    const [deployer] = await ethers.getSigners();

    console.log('Deploying EIP712 contract with account:',deployer.address);


    const EIP712 = await ethers.getContractFactory(EIP712_PROXY_NAME,deployer);
    const eip712 = await EIP712.deploy(
        eas,
        EIP712_PROXY_NAME,
    );    
    const addr = await eip712.getAddress();
    console.log('EIP721 contract address:', addr )
} 

export default  deployEIP712;