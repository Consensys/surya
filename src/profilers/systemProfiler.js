"use strict";

const fs = require('fs')
const parser = require('solidity-parser-antlr')
const path = require('path');
const importHelper = require('../utils/importHelper')
const { contractProfiler } = require('./contractProfiler')


/**
  * Generates a profile of each declared contract, and an object representing the inheritance graph,
  * from an array of solidity files, 
  *
  * @param      {array}  files  A list of paths to each file in the system
  * @return     {object}  systemProfile contains an contractProfiles 
  *                                     object and an inheritanceGraph object
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


  // make the set iterable and generate an array of profiles
  const iterablePaths = systemPaths.values();
  let profiles = contractProfiler(iterablePaths)
  console.log(profiles)
  let contractProfiles = new Object() 
  let inheritanceGraph = new Object()
  for (let profile of profiles) {
    contractProfiles[profile.name] = profile;
    inheritanceGraph[profile.name] = profile.bases
  }

  return { contractProfiles, inheritanceGraph }
}