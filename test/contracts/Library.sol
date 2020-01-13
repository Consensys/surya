pragma solidity ^0.4.19;


contract Tester {
    using SuuuuuuuuuuuuuuuperLooooooooooooooooooongLiiiiiiiiiibraryNaaaaaaaaaaaaaame1 for uint256;
    using SuuuuuuuuuuuuuuuperLooooooooooooooooooongLiiiiiiiiiibraryNaaaaaaaaaaaaaame2 for uint128;
    
    uint public myNum;
    bytes32 public myBytes32 = hex"aabbcc";
    
    function useSFLLN1() public pure returns (uint256) {
        myNum.returnMe();
        uint256(73).returnMe();
        return uint256(73).returnMe2();
    }
    
    function useSFLLN2() public pure returns (uint128) {
        block.timestamp().returnMe();
        return uint128(73).returnMe();
    }
}

library SuuuuuuuuuuuuuuuperLooooooooooooooooooongLiiiiiiiiiibraryNaaaaaaaaaaaaaame1 {
    function returnMe(uint256 myUint) public pure returns (uint256) {
        return myUint;
    }
    
    function returnMe2(uint256 myUint) internal pure returns (uint256) {
        return myUint;
    }
}

library SuuuuuuuuuuuuuuuperLooooooooooooooooooongLiiiiiiiiiibraryNaaaaaaaaaaaaaame2 {
    function returnMe(uint128 myUint) public pure returns (uint128) {
        return myUint;
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

