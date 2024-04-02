// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

// prettier-ignore
import {
    EIP712Proxy,
    DelegatedProxyAttestationRequest,
    DelegatedProxyRevocationRequest,
    MultiDelegatedProxyAttestationRequest,
    MultiDelegatedProxyRevocationRequest
} from "../EIP712Proxy.sol";

import { IEAS } from "../../../IEAS.sol";

import { AccessDenied, uncheckedInc } from "../../../Common.sol";

/// @title PermissionedEIP712Proxy
/// @notice A sample EIP712 proxy that allows only a specific address to attest.
contract PermissionedEIP712Proxy is EIP712Proxy, Ownable {
    /// @dev Creates a new PermissionedEIP712Proxy instance.
    /// @param eas The address of the global EAS contract.
    /// @param name The user readable name of the signing domain.
    constructor(IEAS eas, string memory name) EIP712Proxy(eas, name) {}

    /// @inheritdoc EIP712Proxy
    function attestByDelegation(
        DelegatedProxyAttestationRequest calldata delegatedRequest
    ) public payable override returns (bytes32) {
        // Ensure that only the owner is allowed to delegate attestations.
        _verifyAttester(delegatedRequest.attester);

        return super.attestByDelegation(delegatedRequest);
    }

    /// @inheritdoc EIP712Proxy
    function multiAttestByDelegation(
        MultiDelegatedProxyAttestationRequest[] calldata multiDelegatedRequests
    ) public payable override returns (bytes32[] memory) {
        uint256 length = multiDelegatedRequests.length;
        for (uint256 i = 0; i < length; i = uncheckedInc(i)) {
            // Ensure that only the owner is allowed to delegate attestations.
            _verifyAttester(multiDelegatedRequests[i].attester);
        }

        return super.multiAttestByDelegation(multiDelegatedRequests);
    }

    /// @inheritdoc EIP712Proxy
    function revokeByDelegation(DelegatedProxyRevocationRequest calldata delegatedRequest) public payable override {
        // Ensure that only the owner is allowed to delegate revocations.
        _verifyAttester(delegatedRequest.revoker);

        super.revokeByDelegation(delegatedRequest);
    }

    /// @inheritdoc EIP712Proxy
    function multiRevokeByDelegation(
        MultiDelegatedProxyRevocationRequest[] calldata multiDelegatedRequests
    ) public payable override {
        uint256 length = multiDelegatedRequests.length;
        for (uint256 i = 0; i < length; i = uncheckedInc(i)) {
            // Ensure that only the owner is allowed to delegate revocations.
            _verifyAttester(multiDelegatedRequests[i].revoker);
        }

        super.multiRevokeByDelegation(multiDelegatedRequests);
    }

    /// @dev Ensures that only the allowed attester can attest.
    /// @param attester The attester to verify.
    function _verifyAttester(address attester) private view {
        if (attester != owner()) {
            revert AccessDenied();
        }
    }

    function verifyAttestation(DelegatedProxyAttestationRequest calldata request) public view returns (bool pass){

    }

    bytes32 public constant ATTEST_PROXY_TYPEHASH = 0xea02ffba7dcb45f6fc649714d23f315eef12e3b27f9a7735d8d8bf41eb2b1af1;

    function getTypedData( DelegatedProxyAttestationRequest calldata request) 
        public
        view
        returns (bytes32 typedData){
        return super._hashTypedDataV4(keccak256(
                abi.encode(
                    ATTEST_PROXY_TYPEHASH,
                    request.attester,
                    request.schema,
                    request.data.recipient,
                    request.data.expirationTime,
                    request.data.revocable,
                    request. data.refUID,
                    keccak256( request.data.data),
                    request.data.value,
                    request.deadline
                )
            ));
    }
}
