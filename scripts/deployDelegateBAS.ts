import { ethers } from "hardhat";
// import {PermissionedEIP712Proxy__factory} from "../typechain-types/factories/contracts/eip712/proxy/examples/PermissionedEIP712Proxy__factory.js";


async function deploy(bas:string) {
    const [signer] = await ethers.getSigners();
    console.log('Deploy Point ERC20 contract with account:',signer.address);

    const Point = await ethers.getContractFactory("PermissionedEIP712Proxy",signer)
    const point = await Point.deploy(bas,"OPBNB ATTESTATION DEV")

    await point.waitForDeployment();
    const addr = await point.getAddress();
    console.log('Delegate Attest Contract Address:', addr)
    return addr
}

async function main() {
    const bas = "0xFC5163423ae16A1d7aa26d4D60c3Ae5DE33AA3cA"
    await deploy(bas) 
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });