"use strict";

const fs = require('fs')
const parser = require('solidity-parser-antlr')
const importHelper = require('../utils/importHelper')
const {systemProfiler} = require('./systemProfiler')
const { linearize } = require('c3-linearization')



/**
  * Given an array of solidity files, a systemProfile
  *
  * @param      {array}  files  A list of paths to each file in the system
  * @return     {object}  
  */ 
module.exports.derivedProfiler = function derivedProfiler(files) {
  // 1. get the contracts and imported files in the sytem...
  let { contractProfiles, dependencies } = systemProfiler(files)
  for (let contractProfile of contractProfiles) {

    // then linearize, then reduce
    let linearized = linearize(dependencies, {reverse: true})
    console.log('name: ', contractProfile.name)
    console.log('dependencies: ', dependencies)
    console.log('linear dependencies: ', linearized)
  }
}

module.exports.derivedProfiler([process.argv[2]])

