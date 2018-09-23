/*
Scenario to test:
  contract function having 3 different library functions
*/
pragma solidity ^0.4.24;

import "./test/contracts/temp.sol";
import "./test/contracts/lib/SafeMath.sol";

contract SomeContract {

  using SafeMath for uint256;
  uint public balance1 = 0;
  uint public balance2 = 0;
  uint public balance3 = 0;

  function balance() public {
    balance1 = balance1.add(1);
    balance2 = balance2.div(2);
    balance2 = balance2.mul(3);
  }

  function doSomething() public {
    balance();
  }
}
