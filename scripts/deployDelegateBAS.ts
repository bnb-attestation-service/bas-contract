import { ethers } from "hardhat";
import {EIP712_DEV_BSC_DOMAN_NAME} from "./utils"
import {PermissionedEIP712Proxy__factory } from "../typechain-types/factories/contracts/eip712/proxy/examples/PermissionedEIP712Proxy__factory"

async function deployDelegateAttest(bas:string) {
    const [signer] = await ethers.getSigners();

    const EIP712 = await ethers.getContractFactory("PermissionedEIP712Proxy",signer)
    const eip712 = await EIP712.deploy(bas,EIP712_DEV_BSC_DOMAN_NAME)

    await eip712.waitForDeployment();
    const addr = await eip712.getAddress();
    console.log('Delegate Attest Contract Address:', addr)
    return addr
}
async function delegateAttest(basD:string) {
    const [signer] = await ethers.getSigners();

    const eip712 = await PermissionedEIP712Proxy__factory.connect(basD,signer)
    const owner = await eip712.owner()
    console.log(   `owner:${owner}`)
    const data = new Uint8Array(1)
    const resp = await eip712.attestByDelegation(
        {
            "schema": "0x945d19224e246b979efaaba9fc922dcc5a0f02e261774211183425598bc46b54",
            "data": {
                    "recipient":"0x471543A3bd04486008c8a38c5C00543B73F1769e",
                    "expirationTime": 1731754976n,
                    "revocable": false,
                    "refUID": "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "data":data ,
                    "value": 0
                },
            "signature": {
                "v":27,
                "r":"0x72916c30c7a060d2be611b83754b2e12b97ed7053e7c000c9adff4923bf4074b",
                "s":"0x679bc21bcec348147d5e9d7d1422495ccfb5bd68496b8450d7eeb8847fd2dd2b"            
            },
            "attester": "0x471543A3bd04486008c8a38c5C00543B73F1769e",
            "deadline": 1729180976n
        } 
    )
    resp.wait()
}


async function getDomainSeparator(addr:string) {
    const [signer] = await ethers.getSigners();

    const eip712 = await PermissionedEIP712Proxy__factory.connect(addr,signer)
    const owner = await eip712.owner()
    console.log(   `owner:${owner}`)

    const domain = await eip712.eip712Domain()
    console.log(   `domain:${domain}`)
}
async function main() {
    const bas = "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0"
    const indexer = "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82"
    // const delegateAddr = await deployDelegateAttest(bas,indexer) 
    // await delegateAttest()
    // await getDomainSeparator(delegateAddr)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
