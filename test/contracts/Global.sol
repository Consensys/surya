// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.7.6;
pragma abicoder v2;


struct WithdrawData {
    address channelAddress;
    address assetId;
    address payable recipient;
    uint256 amount;
    uint256 nonce;
    address callTo;
    bytes callData;
}

interface ICMCWithdraw {
    function getWithdrawalTransactionRecord(WithdrawData calldata wd) external view returns (bool);

    function withdraw(
        WithdrawData calldata wd,
        bytes calldata aliceSignature,
        bytes calldata bobSignature
    ) external;
}

contract GlobalDeclarations {
  function wockawocka(uint _input) public pure returns(uint){
    return _input += (2**256 - 2);
  }

  function extCall(uint _input) public pure returns(uint){
    ICMCWithdraw(address(this)).withdraw(
        WithdrawData(
            address(this),
            address(this),
            address(this),
            _input,
            _input,
            address(this),
            bytes(0x0)
        ),
        bytes(0x0),
        bytes(0x0)
    );
  }
}