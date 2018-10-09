"use strict";

const fs = require('fs')
const parser = require('solidity-parser-antlr')
const path = require('path');
const importHelper = require('../utils/importHelper')
const contractProfiler = require('./contractProfiler')


/**
  * Given an array of solidity files, a systemProfile
  *
  * @param      {array}  files  A list of paths to each file in the system
  * @return     {object}  systemProfile contains an array of contractProfile 
  *                                     objects and an inheritanceTree object
  */ 
module.exports.systemProfiler = function systemProfiler(files) {
  // map the files array to absolute paths
  files = files.map(file => path.resolve(process.cwd(), file))
  // filter out dirs
  files = files.filter(file => fs.statSync(file).isFile())
  
  // create a Set with the input files (a Set is like an array which prevents duplication of values)
  let systemPaths = new Set(files)
  // ensure we have the FULL list of import paths (Note: this is probably pretty inefficient. It 
  // could be avoided if we can assume all required files are included in the input array.
  for (let file of files) {
    let pathsFromFile = importHelper.importPathsFromFile(file)

    systemPaths = new Set([...systemPaths, ...pathsFromFile])
  }

  let contractProfiles = new Array() // TODO: maybe should be an object?
  let dependencies = new Object()

  // make the set iterable and 
  const iterablePaths = systemPaths.values();
  for (let path of iterablePaths){
    let profiles = contractProfiler.contractProfilesFromFile(path)

    contractProfiles = contractProfiles.concat(profiles)
    
    for (let profile of profiles) {
      dependencies[profile.name] = profile.bases
      
    }
  }

  return { contractProfiles, dependencies }
}