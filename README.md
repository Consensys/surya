<img src="https://user-images.githubusercontent.com/4008213/39437435-bed48266-4c98-11e8-834d-1de152667231.jpg" height="236">

[![npm](https://img.shields.io/npm/v/surya.svg)](https://www.npmjs.com/package/surya)
[![Build Status](https://travis-ci.com/ConsenSys/surya.svg?branch=master)](https://travis-ci.com/ConsenSys/surya)

# Sūrya, The Sun God: A Solidity Inspector 

#### 

Surya is an utility tool for smart contract systems. It provides a number of visual outputs and information about the contracts' structure. Also supports querying the function call graph in multiple ways to aid in the manual inspection of contracts.

Currently only supports Solidity but we hope to extend the tool to encompass other languages.

The name stems from the sun deity [Surya](https://en.wikipedia.org/wiki/Surya)

Why the sun, you ask? Because "sun" in latin and portuguese is [*Sol*](https://en.wikipedia.org/wiki/Solar_deity).

## Getting Started

Install it via npm:

```shell
npm install -g surya
```

## Command List

### describe

The `describe` command shows a summary of the contracts and methods in the files provided.

```shell
surya describe *.sol
```

<img src="https://user-images.githubusercontent.com/4008213/48572168-97bfc780-e900-11e8-9e86-d265498de936.png" width="336" height="236">

Functions will be listed as:

* `[Pub]` public
* `[Ext]` external
* `[Prv]` private
* `[Int]` internal

A yellow `($)`denotes a function is `payable`.

A red `#` indicates that it's able to modify state.

### inheritance

The `inheritance` command outputs a DOT-formatted graph of the inheritance tree.

```shell
surya inheritance MyContract.sol | dot -Tpng > MyContract.png
```


<img src="https://user-images.githubusercontent.com/23033765/39249140-f50d2828-486b-11e8-81b8-8c4ffb7b1b54.png" height="236">

### graph

The `graph` command outputs a DOT-formatted graph of the control flow.

```shell
surya graph contracts/**/*.sol | dot -Tpng > MyContract.png
```


<img src="https://user-images.githubusercontent.com/4008213/39415345-fbac4e3a-4c39-11e8-8260-0d9670c352d6.png" height="236">

### parse

The `parse` command outputs a "treefied" AST object coming from the parser.

```shell
surya parse MyContract.sol
```


<img src="https://user-images.githubusercontent.com/4008213/39415303-87df40de-4c39-11e8-8e03-ead72e88f1e3.png" height="236">

### ftrace

The `ftrace` command outputs a "treefied" function call trace stemming from the defined "CONTRACT::FUNCTION" and traversing "all|internal|external" types of calls.
External calls are marked in `orange` and internal calls are `uncolored`.

```shell
surya ftrace APMRegistry::_newRepo all MyContract.sol
```


<img src="https://user-images.githubusercontent.com/4008213/42409007-61473d12-81f1-11e8-8fee-1867cfd66822.png" height="236">

## dependencies

The `dependencies` command outputs the [c3-linearization](https://en.wikipedia.org/wiki/C3_linearization) of a given contract's inheirtance graph. Contracts will be listed starting with most-derived, ie. if the same function is defined in more than one contract, the solidity compiler will use the definition in whichever contract is listed first. 

```shell
surya dependencies Exchange Exchange.sol
```

<img src="https://user-images.githubusercontent.com/23033765/43811687-cbb312f4-9a8b-11e8-9d8e-98be09fcd2d4.png" height="300">


### mdreport

The `mdreport` command creates a markdown description report with tables comprising information about the system's files, contracts and their functions.

```shell
surya mdreport report_outfile.md MyContract.sol
```



## License

GPL-3.0

## Kudos

Created by @federicobond extended by @GNSPS
