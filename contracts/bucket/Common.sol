// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import "@lazyledger/protobuf3-solidity-lib/contracts/ProtobufLib.sol";

int32 constant RESOURCE_TYPE_UNSPECIFIED = 0;
int32 constant RESOURCE_TYPE_BUCKET = 1;
int32 constant RESOURCE_TYPE_OBJECT = 2;
int32 constant RESOURCE_TYPE_GROUP =3;

int32 constant PRINCIPAL_TYPE_UNSPECIFIED=0;
int32 constant PRINCIPAL_TYPE_GNFD_ACCOUNT=1;
int32 constant PRINCIPAL_TYPE_GNFD_GROUP =2;

int32 constant ACTION_UNSPECIFIED = 0;
int32 constant ACTION_UPDATE_BUCKET_INFO = 1;
int32 constant ACTION_DELETE_BUCKET = 2;
int32 constant  ACTION_CREATE_OBJECT = 3;
int32 constant ACTION_DELETE_OBJECT = 4;
int32 constant ACTION_COPY_OBJECT = 5;
int32 constant ACTION_GET_OBJECT = 6;
int32 constant ACTION_EXECUTE_OBJECT = 7;
int32 constant ACTION_LIST_OBJECT = 8;
int32 constant ACTION_UPDATE_GROUP_MEMBER = 9;
int32 constant ACTION_DELETE_GROUP = 10;
int32 constant ACTION_UPDATE_OBJECT_INFO = 11;
int32 constant ACTION_UPDATE_GROUP_EXTRA = 12;
int32 constant ACTION_UPDATE_GROUP_INFO = 13;
int32 constant ACTION_UPDATE_OBJECT_CONTENT = 14;

int32 constant EFFECT_UNSPECIFIED = 0;
int32 constant EFFECT_ALLOW = 1;
int32 constant EFFECT_DENY = 2;

struct Timestamp {
    int64 _seconds;
    int32 nanos;
}

struct Policy {
    string id;
    Principal principal;
    int32 resource_type;
    string resource_id;
    Statement[] statements;
    Timestamp expiration_time;
}

struct Principal {
    int32 principal_type;
    string value;
}

struct Statement {
    int32 effect;
    int32[] actions;
    string[] resources;
    Timestamp expiration_time;
    UInt64Value limit_size;
}

struct UInt64Value {
    uint64 value;
}

function encodePrinciple(Principal memory principal) pure returns (bytes memory) {
    bytes memory result;
    if (principal.principal_type != 0) {
        result = abi.encodePacked(ProtobufLib.encode_uint32(8),ProtobufLib.encode_int32(principal.principal_type));
    }

    if (!Strings.equal("",principal.value))  {
        result = abi.encodePacked(result,ProtobufLib.encode_uint32(18),result,ProtobufLib.encode_string(principal.value));
    }
    return result;
}

function encodeStatement(Statement memory statement) pure returns (bytes memory) {
    
    
    bytes memory result;
    if (statement.effect != 0) {
        result = abi.encode(ProtobufLib.encode_uint32(8),ProtobufLib.encode_int32(statement.effect));
    }

    bytes memory actionsBytes = ProtobufLib.encode_uint32(18);
    for (uint i = 0;i< statement.actions.length;i++) {
        actionsBytes = abi.encodePacked(actionsBytes,ProtobufLib.encode_int32(statement.actions[i]));
    }

    bytes memory resourcesBytes;
    for (uint i = 0;i< statement.resources.length;i++) {
        resourcesBytes = abi.encodePacked(resourcesBytes,ProtobufLib.encode_uint32(26),ProtobufLib.encode_string(statement.resources[i]));
    }

    bytes memory expirationTimeBytes;
    if (statement.expiration_time._seconds != 0) {
        expirationTimeBytes = abi.encodePacked(expirationTimeBytes,ProtobufLib.encode_uint32(8),ProtobufLib.encode_int64(statement.expiration_time._seconds));
    }

    if (statement.expiration_time.nanos != 0) {
        expirationTimeBytes = abi.encodePacked(expirationTimeBytes,ProtobufLib.encode_uint32(16),ProtobufLib.encode_int32(statement.expiration_time.nanos));
    }

    bytes memory limitSizeBytes;
    if (statement.limit_size.value != 0) {
        limitSizeBytes = abi.encodePacked(ProtobufLib.encode_uint32(8),ProtobufLib.encode_uint64(statement.limit_size.value));
    }

    return abi.encodePacked(result,actionsBytes,resourcesBytes,expirationTimeBytes,limitSizeBytes); 
}

function encodePolicy(Policy memory policy) pure returns (bytes memory) {
    bytes memory result;
    if (!Strings.equal("",policy.id)) {
        result = abi.encodePacked(ProtobufLib.encode_uint32(10),ProtobufLib.encode_string(policy.id));
    }

    if (policy.principal.principal_type !=0) {
        result = abi.encodePacked(result,ProtobufLib.encode_uint32(18),encodePrinciple(policy.principal));
    }

    if (policy.resource_type != 0) {
        result = abi.encodePacked(result,ProtobufLib.encode_uint32(24),ProtobufLib.encode_int32(policy.resource_type));
    }

    bytes memory statementsBytes;
    for (uint i = 0;i<policy.statements.length;i++) {
        statementsBytes = abi.encodePacked(statementsBytes,ProtobufLib.encode_uint32(42),encodeStatement(policy.statements[i]));
    }

    result = abi.encodePacked(result,statementsBytes);

    bytes memory expirationTimeBytes;
    if (policy.expiration_time._seconds != 0) {
        expirationTimeBytes = abi.encodePacked(expirationTimeBytes,ProtobufLib.encode_uint32(8),ProtobufLib.encode_int64(policy.expiration_time._seconds));
    }

    if (policy.expiration_time.nanos != 0) {
        expirationTimeBytes = abi.encodePacked(expirationTimeBytes,ProtobufLib.encode_uint32(16),ProtobufLib.encode_int32(policy.expiration_time.nanos));
    }
    return abi.encodePacked(result,expirationTimeBytes);
}