import  {ethers  as hardhat} from "hardhat";
import {ethers} from "ethers";
import {IEAS__factory} from "../typechain-types/factories/contracts";
import { AbiCoder }  from "ethers";
import {SCHEMAS,ZERO_ADDRESS,getSchemaUID,NO_EXPIRATION,ZERO_BYTES32} from "./utils";
const NAME_SCHEMA_UID = getSchemaUID('bytes32 schemaId,string name', ZERO_ADDRESS, true);

async function initSchemaName(_EAS:string) {
    const provider = new ethers.JsonRpcProvider(
      "https://data-seed-prebsc-1-s1.binance.org:8545/"
   );

    const [signer] = await hardhat.getSigners();
    console.log('Init Schema Name with account:',signer.address);


    const EAS = IEAS__factory.connect(_EAS,provider)

    for (const {name,schema} of SCHEMAS) {
        const schemaId = getSchemaUID(schema, ZERO_ADDRESS, true);
        const resp = await EAS.connect(signer).attest(
            {
                schema: NAME_SCHEMA_UID,
                data: {
                  recipient: ZERO_ADDRESS,
                  expirationTime: NO_EXPIRATION,
                  revocable: true,
                  refUID: ZERO_BYTES32,
                  data: AbiCoder.defaultAbiCoder().encode(['bytes32', 'string'], [schemaId, name]),
                  value: 0
                }
              }
        );
        console.log(`Named schema ${schema} as "${name}" at tx: ${resp.hash}`);
    }
}

export default initSchemaName;