"use strict";

const profiler = require('./utils/contractProfiler')
const fs = require('fs')
const parser = require('solidity-parser-antlr')
const treeify = require('treeify')

export function profile(file) {
    // const content = fs.readFileSync(file).toString('utf-8')
    // const ast = parser.parse(content)

    let p = profiler.profiler(file)
    // console.log(JSON.stringify(p, null, 2))

    console.log( treeify.asTree(p, true) )
}
