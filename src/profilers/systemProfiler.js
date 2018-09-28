"use strict";

const fs = require('fs')
const parser = require('solidity-parser-antlr')
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
  
  // 1. ensure we have the FULL list of import paths
  // this is probably pretty inefficient. It could be avoided if we assume all
  // required files are included
  let systemPaths = new Set()
  for (let file of files) {
    let pathsFromFile = importHelper.importPathsFromFile(file)

    systemPaths = new Set([...systemPaths, ...pathsFromFile])
  }

  let contractProfiles = new Array() // TODO: maybe should be an object?S
  let dependencies = new Object()

  for (let path of systemPaths){
    let profiles = contractProfiler.contractProfilesFromFile(path)
    // console.log(profiles)
    contractProfiles = contractProfiles.concat(profiles)
    
    for (let profile of profiles) {
      dependencies[profile.name] = profile.bases
      
    }
  }

  // console.log(JSON.stringify({contractProfiles, dependencies}, null, 2))
  return { contractProfiles, dependencies }
}