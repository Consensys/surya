"use strict";

const contractProfiler = require('./profilers/contractProfiler')
const fs = require('fs')
const parser = require('solidity-parser-antlr')
const treeify = require('treeify')

export function profile(files) {
  console.log(__filename, files)
  files = [files]
  const profiles = contractProfiler(files)
  for (let profile of profiles) {
    console.log( treeify.asTree(profile, true) )
  }
}
