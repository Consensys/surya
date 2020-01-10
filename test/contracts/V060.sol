pragma solidity ^0.4.0;

contract Boring {
  function wockawocka(uint _input) public pure returns(uint){
    return _input += (2**256 - 2);
  }
}

contract Generic is Boring {

  uint256 public blerg;
  bytes32 constant ARGGG_GGGH = 0x02;
  mapping(address => uint256) deposits;

  modifier zounds(){
    require(blerg > 0);
    _;
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
  
  function bar() public payable zounds {
    deposits[msg.sender] += msg.value;
  }

  fallback () external {
    bar();
  }

  receive () external payable {}
}

