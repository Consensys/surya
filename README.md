# Solidity Inspector (soli)

#### 

![Build Status](https://img.shields.io/travis/federicobond/soli.svg)
![Coverage](https://img.shields.io/coveralls/federicobond/soli.svg)
![Downloads](https://img.shields.io/npm/dm/soli.svg)
![Downloads](https://img.shields.io/npm/dt/soli.svg)
![npm version](https://img.shields.io/npm/v/soli.svg)
![dependencies](https://img.shields.io/david/federicobond/soli.svg)
![dev dependencies](https://img.shields.io/david/dev/federicobond/soli.svg)
![License](https://img.shields.io/npm/l/soli.svg)

A set of utilities (currently in alpha) for inspecting the structure of Solidity contracts.

## Getting Started

Install it via npm:

```shell
npm install -g soli
```

## Command List

### describe

The `describe` command shows a summary of the contracts and methods in the files provided.

```shell
soli describe MyContract.sol
```

<img src="https://user-images.githubusercontent.com/138426/37748729-b6c42ab2-2d63-11e8-9255-8c30693f8a26.png" width="336" height="236">

### graph

The `graph` command generates a DOT-formatted graph of the control flow.

```shell
soli graph MyContract.sol
```

## License

GPL-3.0
