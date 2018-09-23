/*
Scenario to test:
  library imported from different file in different location as contract
*/
pragma solidity ^0.4.24;

import "./test/contracts/lib/SafeMath.sol";

contract SomeContract {

  using SafeMath for uint256;
  uint public balance1 = 0;

  function balance() public {
    balance1 = balance1.add(1);
  }

  function doSomething() public {
    balance();
  }
}
