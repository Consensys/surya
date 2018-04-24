"use strict";

const fs = require('fs')
const parser = require('solidity-parser-antlr')
const treeify = require('treeify')

export function parse(file) {
    const content = fs.readFileSync(file).toString('utf-8')
    const ast = parser.parse(content)

    // fs.writeFile(file + ".ast", JSON.stringify(ast), (err) => {
    //   if(err) {
    //       return console.log(err);
    //   }
    // }); 

    console.log( treeify.asTree(ast, true) )
}
