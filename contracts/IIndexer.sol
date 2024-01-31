// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IIndexer {
    event Indexed(bytes32 indexed uid);
    function indexAttestation(bytes32 attestationUID) external;
}