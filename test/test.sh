#!/bin/bash

# Tests that scripts aren't completely broken
# We really need better testing! 😂
set -e

## PARSE
node ./bin/surya parse ./test/contracts/Generic.sol 2>&1 > /dev/null
node ./bin/surya parse ./test/contracts/Inheritance.sol 2>&1 > /dev/null
node ./bin/surya parse ./test/contracts/Library.sol 2>&1 > /dev/null
node ./bin/surya parse ./test/contracts/V060.sol 2>&1 > /dev/null

## DESCRIBE
# File by file
node ./bin/surya describe ./test/contracts/Generic.sol 2>&1 > /dev/null
node ./bin/surya describe ./test/contracts/Inheritance.sol 2>&1 > /dev/null
node ./bin/surya describe ./test/contracts/Library.sol 2>&1 > /dev/null
node ./bin/surya describe ./test/contracts/V060.sol 2>&1 > /dev/null
# All at once
node ./bin/surya describe ./test/contracts/*.sol 2>&1 > /dev/null
# With -i flag
node ./bin/surya describe -i ./test/contracts/*.sol 2>&1 > /dev/null

## DEPENDENCIES
# File by file
node ./bin/surya dependencies Generic ./test/contracts/Generic.sol 2>&1 > /dev/null
node ./bin/surya dependencies Child ./test/contracts/Inheritance.sol 2>&1 > /dev/null
node ./bin/surya dependencies Tester ./test/contracts/Library.sol 2>&1 > /dev/null
node ./bin/surya dependencies Generic ./test/contracts/V060.sol 2>&1 > /dev/null
# All at once
node ./bin/surya dependencies Child ./test/contracts/*.sol 2>&1 > /dev/null
# With -i flag
node ./bin/surya dependencies -i Child ./test/contracts/*.sol 2>&1 > /dev/null

## INHERITANCE
# File by file
node ./bin/surya inheritance ./test/contracts/Generic.sol 2>&1 > /dev/null
node ./bin/surya inheritance ./test/contracts/Inheritance.sol 2>&1 > /dev/null
node ./bin/surya inheritance ./test/contracts/Library.sol 2>&1 > /dev/null
node ./bin/surya inheritance ./test/contracts/V060.sol 2>&1 > /dev/null
# All at once
node ./bin/surya inheritance ./test/contracts/*.sol 2>&1 > /dev/null
# With -i flag
node ./bin/surya inheritance -i ./test/contracts/*.sol 2>&1 > /dev/null

## GRAPH
# File by file
node ./bin/surya graph ./test/contracts/Generic.sol 2>&1 > /dev/null
node ./bin/surya graph ./test/contracts/Inheritance.sol 2>&1 > /dev/null
node ./bin/surya graph ./test/contracts/Library.sol 2>&1 > /dev/null
node ./bin/surya graph ./test/contracts/V060.sol 2>&1 > /dev/null
# All at once
node ./bin/surya graph ./test/contracts/*.sol 2>&1 > /dev/null
# With -i flag
node ./bin/surya graph -i ./test/contracts/*.sol 2>&1 > /dev/null

## FTRACE
# F
node ./bin/surya ftrace Generic::foo all ./test/contracts/Generic.sol 2>&1 > /dev/null
node ./bin/surya ftrace Generic::foo internal ./test/contracts/Generic.sol 2>&1 > /dev/null
node ./bin/surya ftrace Generic::foo external ./test/contracts/Generic.sol 2>&1 > /dev/null
node ./bin/surya ftrace Tester::useLib1 all ./test/contracts/Library.sol 2>&1 > /dev/null
node ./bin/surya ftrace Tester::useLib1 internal ./test/contracts/Library.sol 2>&1 > /dev/null
node ./bin/surya ftrace Tester::useLib1 external ./test/contracts/Library.sol 2>&1 > /dev/null
node ./bin/surya ftrace Tester::useLib2 all ./test/contracts/Library.sol 2>&1 > /dev/null
node ./bin/surya ftrace Tester::useLib2 internal ./test/contracts/Library.sol 2>&1 > /dev/null
node ./bin/surya ftrace Tester::useLib2 external ./test/contracts/Library.sol 2>&1 > /dev/null
node ./bin/surya ftrace Tester::useLib3 all ./test/contracts/Library.sol 2>&1 > /dev/null
node ./bin/surya ftrace Tester::useLib3 internal ./test/contracts/Library.sol 2>&1 > /dev/null
node ./bin/surya ftrace Tester::useLib3 external ./test/contracts/Library.sol 2>&1 > /dev/null
# With -i flag
node ./bin/surya ftrace Tester::useLib3 all -i ./test/contracts/*.sol 2>&1 > /dev/null

## MDREPORT
# File by file
node ./bin/surya mdreport testreport.md ./test/contracts/Generic.sol 2>&1
rm testreport.md
node ./bin/surya mdreport testreport.md ./test/contracts/Inheritance.sol 2>&1
rm testreport.md
node ./bin/surya mdreport testreport.md ./test/contracts/Library.sol 2>&1
rm testreport.md
node ./bin/surya mdreport testreport.md ./test/contracts/V060.sol 2>&1
rm testreport.md
# All at once
node ./bin/surya mdreport testreport.md ./test/contracts/*.sol 2>&1
rm testreport.md
# With -i flag
node ./bin/surya mdreport testreport.md ./test/contracts/*.sol 2>&1
rm testreport.md

## FTRACE

echo "No errors thrown on commands tested"