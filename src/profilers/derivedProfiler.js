"use strict";

const fs = require('fs')
const parser = require('solidity-parser-antlr')
const importHelper = require('../utils/importHelper')
const contractProfiler = require('./systemProfiler')


/**
  * Given an array of solidity files, a systemProfile
  *
  * @param      {array}  files  A list of paths to each file in the system
  * @return     {object}  systemProfile contains an array of contractProfile 
  *                                     objects and an inheritanceTree object
  */ 
module.exports.derivedProfiler = function derivedProfiler(file) {
  // 1. get the imports and contracts in the sytem...
  let system = sy


}

