"use strict";

const fs = require('fs')
const parser = require('solidity-parser-antlr')
const importHelper = require('../utils/importHelper')
const { systemProfiler } = require('./systemProfiler')
const { linearize } = require('c3-linearization')



/**
  * Generates the complete profile of a derived contract, from a list of files, and the name of a 
  * contract declared within those files. This function depends on the systemProfiler to profile all
  * the contracts within the inheritance graph of the desired contract.
  *
  * @param      {array}  files  A list of paths to each file in the system
  * @return     {object} derivedProfile 
  */ 
module.exports.derivedProfiler = function derivedProfiler(files, contractName) {
  // get the contract profiles and inheritance graph of the sytem...
  let { contractProfiles, inheritanceGraph } = systemProfiler(files)

  // linearize the inheritanceGraph of the desired contract
  let linearized = linearize(inheritanceGraph, {reverse: true}) 
  debugger;

  let dependencies = linearized[contractName]

  // we want to start with the least derived dependency, so we reverse the array
  dependencies = dependencies.reverse()

  // let contractProfile = new Object() // Info about a contract
  let modifierProfiles = new Array() // List of modifierProfiles defined in a contract
  let functionProfiles = new Array() // List of functionProfiles defined in a contract
  let stateVarProfiles = new Array() // List of stateVarProfiles defined in a contract

  for (let dep of dependencies) {
    functionProfiles = functionProfiles.concat(contractProfiles[dep].functionProfiles)
    modifierProfiles = modifierProfiles.concat(contractProfiles[dep].modifierProfiles)
    stateVarProfiles = stateVarProfiles.concat(contractProfiles[dep].stateVarProfiles)
  }

  return {stateVarProfiles, functionProfiles, modifierProfiles}    
}
