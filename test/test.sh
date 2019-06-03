#!/bin/bash

# Tests that scripts aren't completely broken
set -e

node ./bin/surya describe ./test/contracts/Generic.sol 2>&1 > /dev/null
node ./bin/surya inheritance ./test/contracts/Inheritance.sol 2>&1 > /dev/null
node ./bin/surya parse ./test/contracts/Generic.sol 2>&1 > /dev/null
node ./bin/surya ftrace MinterRole::addMinter all ./test/contracts/UsingFor.sol 2>&1 > /dev/null

echo "No errors thrown on commands tested"
