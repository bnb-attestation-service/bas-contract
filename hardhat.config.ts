import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";


const PRIVATE_KEY = process.env.PRIVATE_KEY as string;
const BNB_RPC = process.env.BNB_RPC as string;
const BNB_TEST_RPC = process.env.BNB_TEST_RPC as string;
const API_KEY = process.env.API_KEY as string;

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.19',
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000000
      },
      metadata: {
        bytecodeHash: 'none'
      }
    }
  },
  networks:{
    ["bnb-test"]: {
      chainId: 97,
      url: BNB_TEST_RPC,
      accounts: [PRIVATE_KEY]
    },
    ["bnb"]:{
      chainId:56,
      url: BNB_RPC,
      accounts:[PRIVATE_KEY]
    }
  },
  etherscan:{
    apiKey: API_KEY
  }
};

export default config;
