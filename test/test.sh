#!/bin/bash

# Tests that scripts aren't completely broken
set -e

node ./bin/surya describe ./test/contracts/Featureful.sol 2>&1 > /dev/null
node ./bin/surya inheritance ./test/contracts/Inheritor.sol 2>&1 > /dev/null
node ./bin/surya parse ./test/contracts/Featureful.sol 2>&1 > /dev/null

echo "No errors thrown on commands tested"