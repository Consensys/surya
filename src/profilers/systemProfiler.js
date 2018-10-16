"use strict";

const fs = require('fs')
const parser = require('solidity-parser-antlr')
const path = require('path');
const importProfiler = require('./importProfiler')
const contractProfiler = require('./contractProfiler')


/**
  * Generates a profile of each declared contract, and an object representing the inheritance graph,
  * from an array of solidity files, 
  *
  * @param      {array}  files  A list of paths to each file in the system
  * @return     {object}  systemProfile contains an contractProfiles 
  *                                     object and an inheritanceGraph object
  */ 
module.exports = function systemProfiler(files) {
  let importedFiles = importProfiler(files)

  let profiles = contractProfiler(importedFiles)

  let contractProfiles = new Object() 
  let inheritanceGraph = new Object()
  for (let profile of profiles) {
    contractProfiles[profile.name] = profile;
    inheritanceGraph[profile.name] = profile.bases
  }

  return { contractProfiles, inheritanceGraph }
}