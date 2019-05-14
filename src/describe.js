"use strict";

const fs = require('fs')
const parser = require('solidity-parser-antlr')

export function describe(files, options = {}, noColorOutput = false) {
  // make the files array unique by typecastign them to a Set and back
  // this is not needed in case the importer flag is on, because the 
  // importer module already filters the array internally
  if(options.importer) {
    files = importer.importProfiler(files)
  } else {
    files = [...new Set(files)];
  }
  
  for (let file of files) {
    const content = fs.readFileSync(file).toString('utf-8')
    const ast = parser.parse(content)

    parser.visit(ast, {
      ContractDefinition(node) {

        const name = node.name
        let bases = node.baseContracts.map(spec => {
          return spec.baseName.namePath
        }).join(', ')

        bases = bases.length ? 
                  noColorOutput ?
                    `(${bases})`
                    : `(${bases})`.gray
                  : ''

        let specs = ''
        if (node.kind === 'library') {
          specs += noColorOutput ? '[Lib]' : '[Lib]'.yellow
        } else if (node.kind === 'interface') {
          specs += noColorOutput ? '[Int]' : '[Int]'.blue
        }

        console.log(` + ${specs} ${name} ${bases}`)
      },

      'ContractDefinition:exit': function(node) {
        console.log('')
      },

      FunctionDefinition(node) {
        let name

        if (node.isConstructor) {
          name = noColorOutput ? '<Constructor>' : '<Constructor>'.gray
        } else if (!node.name) {
          name = noColorOutput ? '<Fallback>' : '<Fallback>'.gray
        } else {
          name = node.name
        }

        let spec = ''
        if (node.visibility === 'public' || node.visibility === 'default') {
          spec += noColorOutput ? '[Pub]' : '[Pub]'.green
        } else if (node.visibility === 'external') {
          spec += noColorOutput ? '[Ext]' : '[Ext]'.blue
        } else if (node.visibility === 'private') {
          spec += noColorOutput ? '[Prv]' : '[Prv]'.red
        } else if (node.visibility === 'internal') {
          spec += noColorOutput ? '[Int]' : '[Int]'.gray
        }

        let payable = ''
        if (node.stateMutability === 'payable') {
          payable = noColorOutput ? ' ($)' : ' ($)'.yellow
        }

        let mutating = ''
        if (!node.stateMutability) {
          mutating = noColorOutput ? ' #' : ' #'.red
        }

        console.log(`    - ${spec} ${name}${payable}${mutating}`)
      }
    })
  }

  // Print a legend for symbols being used
  let mutationSymbol = noColorOutput ? ' #' : ' #'.red
  let payableSymbol = noColorOutput ? ' ($)' : ' ($)'.yellow

  console.log(`
${payableSymbol} = payable function
${mutationSymbol} = non-constant function
  `)
}
