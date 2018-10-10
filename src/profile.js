"use strict";

const { contractProfiler } = require('./profilers/contractProfiler')
const fs = require('fs')
const parser = require('solidity-parser-antlr')
const treeify = require('treeify')

export function profile(file) {
    let p = profiler.profiler(file)
    console.log( treeify.asTree(p, true) )
}
