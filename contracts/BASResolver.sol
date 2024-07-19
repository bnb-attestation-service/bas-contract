// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import { Address } from "@openzeppelin/contracts/utils/Address.sol";

import { SchemaResolver } from "./resolver/SchemaResolver.sol";

import { IEAS, Attestation } from "./IEAS.sol";

import  "@openzeppelin/contracts/token/ERC20/IERC20.sol";


import "@openzeppelin/contracts/access/Ownable.sol";


/// @title PayingResolver
/// @notice A sample schema resolver that pays attesters (and expects the payment to be returned during revocations).
contract PayingResolver is SchemaResolver, Ownable {
    using Address for address payable;

    error InvalidValue();

    uint256 public _incentiveBasicToken;
    uint256 public _incentiveBAS;
    address public _bas;

    uint256 public _basicTokenIncome;
    uint256 public _basIncome;

    event Withdraw(uint256 basicToken, uint256 bas);

    constructor(IEAS eas, uint256 incentiveBasicToken, uint256 incentiveBAS,address bas)  SchemaResolver(eas) {
        _incentiveBasicToken = incentiveBasicToken;
        _incentiveBAS = incentiveBAS;
        _bas = bas;
    }

    function updateIncentive(uint256 incentiveBasicToken, uint256 incentiveBAS)  onlyOwner public {
         _incentiveBasicToken = incentiveBasicToken;
         _incentiveBAS = incentiveBAS;
    }  


    function updateFeeToken(address newBasToken) onlyOwner public {
        require(newBasToken != _bas,"Invalid token Address");
        _bas = newBasToken;
    }
    function isPayable() public pure override returns (bool) {
        return true;
    }

    function onAttest(Attestation calldata attestation, uint256 value) internal override returns (bool) {
        if (_incentiveBasicToken == 0 && _incentiveBAS == 0) {
            return true;
        }

        if (value > 0) {
            if (value < _incentiveBasicToken) {
                return false;
            }

           if (value > _incentiveBasicToken) {
                payable(address(attestation.recipient)).sendValue(value - _incentiveBasicToken);
            }
            _basicTokenIncome += _incentiveBasicToken;
            return true;

        } else {
            if (IERC20(_bas).allowance(attestation.recipient, address(this)) < _incentiveBAS) {
                return false;
            } else {
                IERC20(_bas).transferFrom(attestation.recipient, address(this), _incentiveBAS);
                _basIncome+=_incentiveBAS;
                return true;
            }
        }
    }

    function onRevoke(Attestation calldata /*attestation*/, uint256 /*value*/) internal pure override returns (bool) {
        return true;
    }

    function withdraw() onlyOwner() public {
        payable(msg.sender).sendValue(_basicTokenIncome);
        IERC20(_bas).transfer(msg.sender, _basIncome);
        emit Withdraw(_basicTokenIncome, _basIncome);
        _basicTokenIncome = 0;
        _basIncome = 0;
    }
}
