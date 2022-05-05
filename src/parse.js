"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.parse = parse;
var fs = require('fs');
var parser = require('@solidity-parser/parser');
var treeify = require('treeify');

function parse(file, options = {}) {
    var content = fs.readFileSync(file).toString('utf-8');
    var ast = function () {
        try {
                return parser.parse(content, { tolerance: options.tolerance, loc: options.location, range: options.range });
        } catch (err) {
            console.log('Error found while parsing the following file: ' + file);
            throw err;
        }
    }();

    if (options.jsonOutput) {

        return JSON.stringify(ast);
    } else {

        return treeify.asTree(ast, true);
    }
}
