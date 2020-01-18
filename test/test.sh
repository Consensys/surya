#!/bin/bash

# Tests that scripts aren't completely broken
# We really need better testing! 😂
set -e


## PARSE
echo "### TEST 'parse' command"
echo ""
echo "node ./bin/surya parse ./test/contracts/Generic.sol 2>&1 > /dev/null"
node ./bin/surya parse ./test/contracts/Generic.sol 2>&1 > /dev/null
echo "Passed ✅"
echo ""
echo "node ./bin/surya parse ./test/contracts/Inheritance.sol 2>&1 > /dev/null"
node ./bin/surya parse ./test/contracts/Inheritance.sol 2>&1 > /dev/null
echo "Passed ✅"
echo ""
echo "node ./bin/surya parse ./test/contracts/Library.sol 2>&1 > /dev/null"
node ./bin/surya parse ./test/contracts/Library.sol 2>&1 > /dev/null
echo "Passed ✅"
echo ""
echo "node ./bin/surya parse ./test/contracts/V060.sol 2>&1 > /dev/null"
node ./bin/surya parse ./test/contracts/V060.sol 2>&1 > /dev/null
echo "Passed ✅"
echo ""
echo ""


## DESCRIBE
# File by file
echo "### TEST 'describe' command"
echo ""
echo "node ./bin/surya describe ./test/contracts/Generic.sol 2>&1 > /dev/null"
node ./bin/surya describe ./test/contracts/Generic.sol 2>&1 > /dev/null
echo "Passed ✅"
echo ""
echo "node ./bin/surya describe ./test/contracts/Inheritance.sol 2>&1 > /dev/null"
node ./bin/surya describe ./test/contracts/Inheritance.sol 2>&1 > /dev/null
echo "Passed ✅"
echo ""
echo "node ./bin/surya describe ./test/contracts/Library.sol 2>&1 > /dev/null"
node ./bin/surya describe ./test/contracts/Library.sol 2>&1 > /dev/null
echo "Passed ✅"
echo ""
echo "node ./bin/surya describe ./test/contracts/V060.sol 2>&1 > /dev/null"
node ./bin/surya describe ./test/contracts/V060.sol 2>&1 > /dev/null
echo "Passed ✅"
echo ""
# All at once
echo "node ./bin/surya describe ./test/contracts/*.sol 2>&1 > /dev/null"
node ./bin/surya describe ./test/contracts/*.sol 2>&1 > /dev/null
echo "Passed ✅"
echo ""
# With -i flag
echo "node ./bin/surya describe -i ./test/contracts/*.sol 2>&1 > /dev/null"
node ./bin/surya describe -i ./test/contracts/*.sol 2>&1 > /dev/null
echo "Passed ✅"
echo ""
echo ""


## DEPENDENCIES
# File by file
echo "### TEST 'dependencies' command"
echo ""
echo "node ./bin/surya dependencies Generic ./test/contracts/Generic.sol 2>&1 > /dev/null"
node ./bin/surya dependencies Generic ./test/contracts/Generic.sol 2>&1 > /dev/null
echo "Passed ✅"
echo ""
echo "node ./bin/surya dependencies Child ./test/contracts/Inheritance.sol 2>&1 > /dev/null"
node ./bin/surya dependencies Child ./test/contracts/Inheritance.sol 2>&1 > /dev/null
echo "Passed ✅"
echo ""
echo "node ./bin/surya dependencies Tester ./test/contracts/Library.sol 2>&1 > /dev/null"
node ./bin/surya dependencies Tester ./test/contracts/Library.sol 2>&1 > /dev/null
echo "Passed ✅"
echo ""
echo "node ./bin/surya dependencies Generic ./test/contracts/V060.sol 2>&1 > /dev/null"
node ./bin/surya dependencies Generic ./test/contracts/V060.sol 2>&1 > /dev/null
echo "Passed ✅"
echo ""
# All at once
echo "node ./bin/surya dependencies Child ./test/contracts/*.sol 2>&1 > /dev/null"
node ./bin/surya dependencies Child ./test/contracts/*.sol 2>&1 > /dev/null
echo "Passed ✅"
echo ""
# With -i flag
echo "node ./bin/surya dependencies -i Child ./test/contracts/*.sol 2>&1 > /dev/null"
node ./bin/surya dependencies -i Child ./test/contracts/*.sol 2>&1 > /dev/null
echo "Passed ✅"
echo ""
echo ""


## INHERITANCE
# File by file
echo "### TEST 'inheritance' command"
echo ""
echo "node ./bin/surya inheritance ./test/contracts/Generic.sol 2>&1 > /dev/null"
node ./bin/surya inheritance ./test/contracts/Generic.sol 2>&1 > /dev/null
echo "Passed ✅"
echo ""
echo "node ./bin/surya inheritance ./test/contracts/Inheritance.sol 2>&1 > /dev/null"
node ./bin/surya inheritance ./test/contracts/Inheritance.sol 2>&1 > /dev/null
echo "Passed ✅"
echo ""
echo "node ./bin/surya inheritance ./test/contracts/Library.sol 2>&1 > /dev/null"
node ./bin/surya inheritance ./test/contracts/Library.sol 2>&1 > /dev/null
echo "Passed ✅"
echo ""
echo "node ./bin/surya inheritance ./test/contracts/V060.sol 2>&1 > /dev/null"
node ./bin/surya inheritance ./test/contracts/V060.sol 2>&1 > /dev/null
echo "Passed ✅"
echo ""
# All at once
echo "node ./bin/surya inheritance ./test/contracts/*.sol 2>&1 > /dev/null"
node ./bin/surya inheritance ./test/contracts/*.sol 2>&1 > /dev/null
echo "Passed ✅"
echo ""
# With -i flag
echo "node ./bin/surya inheritance -i ./test/contracts/*.sol 2>&1 > /dev/null"
node ./bin/surya inheritance -i ./test/contracts/*.sol 2>&1 > /dev/null
echo "Passed ✅"
echo ""
echo ""


## GRAPH
# File by file
echo "### TEST 'graph' command"
echo ""
echo "node ./bin/surya graph ./test/contracts/Generic.sol 2>&1 > /dev/null"
node ./bin/surya graph ./test/contracts/Generic.sol 2>&1 > /dev/null
echo "Passed ✅"
echo ""
echo "node ./bin/surya graph ./test/contracts/Inheritance.sol 2>&1 > /dev/null"
node ./bin/surya graph ./test/contracts/Inheritance.sol 2>&1 > /dev/null
echo "Passed ✅"
echo ""
echo "node ./bin/surya graph ./test/contracts/Library.sol 2>&1 > /dev/null"
node ./bin/surya graph ./test/contracts/Library.sol 2>&1 > /dev/null
echo "Passed ✅"
echo ""
echo "node ./bin/surya graph ./test/contracts/V060.sol 2>&1 > /dev/null"
node ./bin/surya graph ./test/contracts/V060.sol 2>&1 > /dev/null
echo "Passed ✅"
echo ""
# All at once
echo "node ./bin/surya graph ./test/contracts/*.sol 2>&1 > /dev/null"
node ./bin/surya graph ./test/contracts/*.sol 2>&1 > /dev/null
echo "Passed ✅"
echo ""
# With -i flag
echo "node ./bin/surya graph -i ./test/contracts/*.sol 2>&1 > /dev/null"
node ./bin/surya graph -i ./test/contracts/*.sol 2>&1 > /dev/null
echo "Passed ✅"
echo ""
echo ""


## FTRACE
# File by file
echo "### TEST 'ftrace' command"
echo ""
echo "node ./bin/surya ftrace Generic::foo all ./test/contracts/Generic.sol 2>&1 > /dev/null"
node ./bin/surya ftrace Generic::foo all ./test/contracts/Generic.sol 2>&1 > /dev/null
echo "Passed ✅"
echo ""
echo "node ./bin/surya ftrace Generic::foo internal ./test/contracts/Generic.sol 2>&1 > /dev/null"
node ./bin/surya ftrace Generic::foo internal ./test/contracts/Generic.sol 2>&1 > /dev/null
echo "Passed ✅"
echo ""
echo "node ./bin/surya ftrace Generic::foo external ./test/contracts/Generic.sol 2>&1 > /dev/null"
node ./bin/surya ftrace Generic::foo external ./test/contracts/Generic.sol 2>&1 > /dev/null
echo "Passed ✅"
echo ""
echo "node ./bin/surya ftrace Tester::useLib1 all ./test/contracts/Library.sol 2>&1 > /dev/null"
node ./bin/surya ftrace Tester::useLib1 all ./test/contracts/Library.sol 2>&1 > /dev/null
echo "Passed ✅"
echo ""
echo "node ./bin/surya ftrace Tester::useLib1 internal ./test/contracts/Library.sol 2>&1 > /dev/null"
node ./bin/surya ftrace Tester::useLib1 internal ./test/contracts/Library.sol 2>&1 > /dev/null
echo "Passed ✅"
echo ""
echo "node ./bin/surya ftrace Tester::useLib1 external ./test/contracts/Library.sol 2>&1 > /dev/null"
node ./bin/surya ftrace Tester::useLib1 external ./test/contracts/Library.sol 2>&1 > /dev/null
echo "Passed ✅"
echo ""
echo "node ./bin/surya ftrace Tester::useLib2 all ./test/contracts/Library.sol 2>&1 > /dev/null"
node ./bin/surya ftrace Tester::useLib2 all ./test/contracts/Library.sol 2>&1 > /dev/null
echo "Passed ✅"
echo ""
echo "node ./bin/surya ftrace Tester::useLib2 internal ./test/contracts/Library.sol 2>&1 > /dev/null"
node ./bin/surya ftrace Tester::useLib2 internal ./test/contracts/Library.sol 2>&1 > /dev/null
echo "Passed ✅"
echo ""
echo "node ./bin/surya ftrace Tester::useLib2 external ./test/contracts/Library.sol 2>&1 > /dev/null"
node ./bin/surya ftrace Tester::useLib2 external ./test/contracts/Library.sol 2>&1 > /dev/null
echo "Passed ✅"
echo ""
echo "node ./bin/surya ftrace Tester::useLib3 all ./test/contracts/Library.sol 2>&1 > /dev/null"
node ./bin/surya ftrace Tester::useLib3 all ./test/contracts/Library.sol 2>&1 > /dev/null
echo "Passed ✅"
echo ""
echo "node ./bin/surya ftrace Tester::useLib3 internal ./test/contracts/Library.sol 2>&1 > /dev/null"
node ./bin/surya ftrace Tester::useLib3 internal ./test/contracts/Library.sol 2>&1 > /dev/null
echo "Passed ✅"
echo ""
echo "node ./bin/surya ftrace Tester::useLib3 external ./test/contracts/Library.sol 2>&1 > /dev/null"
node ./bin/surya ftrace Tester::useLib3 external ./test/contracts/Library.sol 2>&1 > /dev/null
echo "Passed ✅"
echo ""
# With -i flag
echo "node ./bin/surya ftrace Tester::useLib3 all -i ./test/contracts/*.sol 2>&1 > /dev/null"
node ./bin/surya ftrace Tester::useLib3 all -i ./test/contracts/*.sol 2>&1 > /dev/null
echo "Passed ✅"
echo ""
echo ""


## MDREPORT
# File by file
echo "### TEST 'mdreport' command"
echo ""
echo "node ./bin/surya mdreport testreport.md ./test/contracts/Generic.sol 2>&1"
node ./bin/surya mdreport testreport.md ./test/contracts/Generic.sol 2>&1
echo "Passed ✅"
rm testreport.md
echo ""
echo "node ./bin/surya mdreport testreport.md ./test/contracts/Inheritance.sol 2>&1"
node ./bin/surya mdreport testreport.md ./test/contracts/Inheritance.sol 2>&1
echo "Passed ✅"
rm testreport.md
echo ""
echo "node ./bin/surya mdreport testreport.md ./test/contracts/Library.sol 2>&1"
node ./bin/surya mdreport testreport.md ./test/contracts/Library.sol 2>&1
echo "Passed ✅"
rm testreport.md
echo ""
echo "node ./bin/surya mdreport testreport.md ./test/contracts/V060.sol 2>&1"
node ./bin/surya mdreport testreport.md ./test/contracts/V060.sol 2>&1
echo "Passed ✅"
rm testreport.md
echo ""
# All at once
echo "node ./bin/surya mdreport testreport.md ./test/contracts/*.sol 2>&1"
node ./bin/surya mdreport testreport.md ./test/contracts/*.sol 2>&1
echo "Passed ✅"
rm testreport.md
echo ""
# With -i flag
echo "node ./bin/surya mdreport testreport.md ./test/contracts/*.sol 2>&1"
node ./bin/surya mdreport testreport.md ./test/contracts/*.sol 2>&1
echo "Passed ✅"
rm testreport.md
echo ""
echo ""


echo "No errors thrown on commands tested! 🎉"