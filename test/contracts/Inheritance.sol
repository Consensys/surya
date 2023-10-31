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

abstract contract Foo {
    string private _fooA;
    string private _fooB;

    constructor(string memory fooA_) {
        _setFooA(fooA_);
    }
    
    function _setFooA(string memory fooA_) internal {
        _fooA = fooA_;
    }
    
    function _setFooB(string memory fooB_) internal {
        _fooB = fooB_;
    }
}

contract MyContract is Foo {
    constructor() Foo("A") {
        super._setFooB("B");
    }
}