"use strict";

const fs = require('fs')
const parser = require('solidity-parser-antlr')
const colors = require('colors')

export function describe(files) {
  for (let file of files) {
    const content = fs.readFileSync(file).toString('utf-8')
    const ast = parser.parse(content)

    parser.visit(ast, {
      ContractDefinition(node) {

        const name = node.name
        let bases = node.baseContracts.map(spec => {
          return spec.baseName.namePath
        }).join(', ')

        bases = bases.length ? `(${bases})`.gray : ''

        let specs = ''
        if (node.kind === 'library') {
          specs += '[Lib]'.yellow
        } else if (node.kind === 'interface') {
          specs += '[Int]'.blue
        }

        console.log(` + ${specs} ${name} ${bases}`)
      },

      'ContractDefinition:exit': function(node) {
        console.log('')
      },

      FunctionDefinition(node) {
        let name

        if (node.isConstructor) {
          name = '<Constructor>'.gray
        } else if (!node.name) {
          name = '<Fallback>'.gray
        } else {
          name = node.name
        }

        let spec = ''
        if (node.visibility === 'public' || node.visibility === 'default') {
          spec += '[Pub]'.green
        } else if (node.visibility === 'external') {
          spec += '[Ext]'.blue
        } else if (node.visibility === 'private') {
          spec += '[Prv]'.red
        } else if (node.visibility === 'internal') {
          spec += '[Int]'.gray
        }

        let payable = ''
        if (node.stateMutability === 'payable') {
          payable = ' ($)'.yellow
        }

        let mutating = ''
        if (!node.stateMutability) {
          mutating = ' #'.red
        }

        console.log(`    - ${spec} ${name}${payable}${mutating}`)
      }
    })
  }

  // Print a legend for symbols being used
  let mutationSymbol = ' #'.red
  let payableSymbol = ' ($)'.yellow

  console.log(`
${payableSymbol} = payable function
${mutationSymbol} = non-constant function
  `)
}
