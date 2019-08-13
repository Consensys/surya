"use strict";

const fs = require('fs')
const parser = require('solidity-parser-antlr')
const treeify = require('treeify')

export function parse(file) {
    const content = fs.readFileSync(file).toString('utf-8')
    const ast = parser.parse(content)

    return treeify.asTree(ast, true)
}
