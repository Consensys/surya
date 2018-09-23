/*
Scenario to test:
  contract function importing 2 different libraries,
  out of which 1 is taken from locally installed module
*/
pragma solidity ^0.4.24;

import "./test/contracts/Message.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";

contract SomeContract {

  using SafeMath for uint256;
  using Message for string;

  uint public balance1 = 0;
  uint public balance2 = 0;
  uint public balance3 = 0;
  string message;

  function balance() public {
    balance1 = balance1.add(1);
    balance2 = balance2.div(2);
    balance2 = balance2.mul(3);
  }

  function doSomething() public {
    message.hello();
    balance();
  }
}
