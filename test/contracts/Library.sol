pragma solidity ^0.4.19;


contract Tester {
    using Lib1 for uint256;
    using Lib2 for uint128;
    using Lib3 for address;
    
    uint public myNum;
    bytes32 public myBytes32 = hex"aabbcc";
    
    function useLib1() public view returns (uint256) {
        block.timestamp.returnMe();
        now.returnMe();
        myNum.returnMe();
        uint256(73).returnMe();
        return uint256(73).returnMe2();
    }
    
    function useLib2() public pure returns (uint128) {
        return uint128(73).returnMe();
    }
    
    function useLib3() public view returns (address) {
        address(0).returnMe();
        address(0x0).returnMe();
        msg.sender.returnMe();
        tx.origin.returnMe();
        block.coinbase.returnMe();
        return address(0).returnMe();
    }
}

library Lib1 {
    function returnMe(uint256 myUint) public pure returns (uint256) {
        return myUint;
    }
    
    function returnMe2(uint256 myUint) internal pure returns (uint256) {
        return myUint;
    }
}

library Lib2 {
    function returnMe(uint128 myUint) public pure returns (uint128) {
        return myUint;
    }
}

library Lib3 {
    function returnMe(address myAddress) public pure returns (address) {
        return myAddress;
    }
}

contract Tester2 {
    uint public myNum;
    
    function useInternalOnly() public pure returns (uint256) {
        return testShort.something(1);
    }
    
    function usePublic() public pure returns (uint256) {
        return testShort.something2(1);
    }
}

library testShort {
    function something(uint256 myUint) internal pure returns (uint256) {
        return myUint;
    }
    
    function something2(uint256 myUint) public pure returns (uint256) {
        return myUint + 1;
    }
}

