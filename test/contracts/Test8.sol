/*
Scenario to test:
  contract function without external library functions
*/
pragma solidity ^0.4.24;

contract SomeContract {

  uint public balance1 = 0;

  function balance(uint number) public {
    balance1 += number;
  }

  function doSomething() public {
    balance(3);
  }
}
