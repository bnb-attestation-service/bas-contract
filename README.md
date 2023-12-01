# BAS Contract

The contracts of BAS are forked from [EAS](https://github.com/ethereum-attestation-service/eas-contracts).

## Deploy

- Install [hardhat](https://hardhat.org/tutorial/setting-up-the-environment)
- Compile contract: ``npx hardhat compile``
- Set RPC endpoint & deploy key in system env

    ```shell
        export PRIVATE_KEY = ${deploy_key}
        export BNB_RPC = ${bnb_rpc_url}
        export BNB_TEST_RPC = ${bnb_testnet_rpc_url}
    ```

- Deploy contracts:

    ```shell
        npx hardhat run scripts/deploy.ts --network bnb #deploy in bnb chain
        npx hardhat run scripts/deploy.ts --network bnb-test #deploy in bnb testnet
    ```

## Contract

Current deployed contracts are:

### BNB mainnet

- BAS contract: `0x247Fe62d887bc9410c3848DF2f322e52DA9a51bC`
- Schema Registry contract: `0x5e905F77f59491F03eBB78c204986aaDEB0C6bDa`
- Delegate contract: `0x01dAc45529a070Cb67Fc5B328a7eBE394644355B`

### BNB testnet

- BAS contract: `0x6c2270298b1e6046898a322acB3Cbad6F99f7CBD`
- Schema Registry contract: `0x08C8b8417313fF130526862f90cd822B55002D72`
- Delegate contract: `0x3b32B97092f09Ad34E5766e239e4C2F76b0DEe43`

## More Information

You can get more information in [BAS Doc](https://github.com/ridoio/bas-js-sdk).
