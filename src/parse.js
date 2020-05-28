"use strict";

const fs = require('fs');
const parser = require('@solidity-parser/parser');
const treeify = require('treeify');

export function parse(file) {
    const content = fs.readFileSync(file).toString('utf-8');
    const ast = (() => {
        try {
            return parser.parse(content);
        } catch (err) {
            console.log(`Error found while parsing the following file: ${file}`);
            throw err;
        }
    })();

    return treeify.asTree(ast, true);
}
