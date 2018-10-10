pragma solidity ^0.4.0;

contract Boring {
  function wockawocka(uint _input) public pure returns(uint){
    return _input += (2**256 - 2);
  }
}

contract Generic is Boring {

  struct MyType {
    bytes8 obla;
    bytes8 di;
    uint16 obl;
    uint16 ada;
    string lifeGoesOn;
    bytes Wa;
  }

  enum Mune {Various, States, Of, Being}

  bytes32 a;
  uint256 public blerg;
  bytes32 constant ARGGG_GGGH = 0x02;
  MyType aStruct;

  
  bytes32[21] fixedArray;
  MyType[] dynArray;
  mapping(address => uint256) deposits;
  mapping(address => uint256[]) mapsToArray;
  mapping(bytes32 => mapping(uint256 => bool)) mapsToMap;
  


  modifier zounds(){
    require(blerg > 0);
    _;
  }

  modifier egad(){
    // hmmm... note to self, how does order of modifiers affect things?
    _;
    blerg += 1;
  }

  constructor(uint _someArg) public {
    blerg = _someArg;
  }

  function foo() 
    internal
    constant
    zounds()
    returns(uint8)
  { 
    return 1;
  }
  
  function bar() public payable {
    deposits[msg.sender] += msg.value;
  }

  function () public payable zounds egad {
    bar();

    blerg--;
  }
}

