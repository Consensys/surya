#!/bin/bash

# Tests that scripts aren't completely broken
set -e

commandName="$1"
if [ "$commandName" == "all" ] ;then
	node ./bin/surya describe ./test/contracts/Generic.sol #2>&1 > /dev/null
	node ./bin/surya inheritance ./test/contracts/Inheritance.sol #2>&1 > /dev/null
	node ./bin/surya parse ./test/contracts/Generic.sol #2>&1 > /dev/null
elif [ "$commandName" == "ftrace" ]; then
	echo "Test 1: Library defined in same file as contract file"
	node ./bin/surya ${commandName} SomeContract::doSomething all ./test/contracts/Test1.sol
	echo "Test 2: Lbrary imported from different file in same location as contract"
	node ./bin/surya ${commandName} SomeContract::doSomething all ./test/contracts/Test2.sol
	echo "Test 3: Library imported from different file in different location as contract"
	node ./bin/surya ${commandName} SomeContract::doSomething all ./test/contracts/Test3.sol
	echo "Test 4: Library in same file as contract file + 1 import of another contract"
	node ./bin/surya ${commandName} SomeContract::doSomething all ./test/contracts/Test4.sol
	echo "Test 5: Library imported from different file + 1 import of another contract"
	node ./bin/surya ${commandName} SomeContract::doSomething all ./test/contracts/Test5.sol
	echo "Test 6: Contract function having 2 different library functions"
	node ./bin/surya ${commandName} SomeContract::doSomething all ./test/contracts/Test6.sol
	echo "Test 7: Contract function having 3 different library functions"
	node ./bin/surya ${commandName} SomeContract::doSomething all ./test/contracts/Test7.sol
	echo "Test 8: Contract function without external library functions"
	node ./bin/surya ${commandName} SomeContract::doSomething all ./test/contracts/Test8.sol
	echo "Test 9: Contract function importing 2 different libraries"
	node ./bin/surya ${commandName} SomeContract::doSomething all ./test/contracts/Test9.sol

fi

echo "No errors thrown on commands tested"
