pragma solidity ^0.4.19;

contract Child is SecondParent, FirstParent {}

contract FirstParent is FourthParent, ThirdParent {}

contract SecondParent is ThirdParent {}

contract ThirdParent is IThirdParent, FourthParent {}

// should error if uncommented
// contract ThirdParent is IThirdParent, FourthParent, Child {} 

contract FourthParent {}

// Linearization is _something_ like this:
// Child
// └─ FirstParent <- SecondParent <- ThirdParent <- FourthParent <- IThirdParent

abstract contract A {
    function fooA() public pure returns (string memory) {
        return "A";
    }
}

abstract contract B {}

contract C is A, B {
    function fooC() public pure returns (string memory) {
        return super.fooA();
    }
}