"use strict";

const fs = require('fs')
const parser = require('solidity-parser-antlr')
const colors = require('colors')
const sha1File = require('sha1-file')

export function mdreport(outfile, infiles) {
  if (infiles.length === 0) {
    console.log('No files were specified for analysis in the arguments. Bailing...')
    return
  }

  let filesTable = `
|  File Name  |  SHA-1 Hash  |
|-------------|--------------|
`

  let contractsTable = `
|  Smart Contract Name  |  Type  |  Bases  |  Function Name  |  Visibility  |  Mutability  |  Modifiers  |
|:---------------------:|:------:|:-------:|----------------:|:------------:|:------------:|:-----------:|
`

  for (let file of infiles) {
    filesTable += `| ${file} | ${sha1File(file)} |
`

    const content = fs.readFileSync(file).toString('utf-8')
    const ast = parser.parse(content)

    parser.visit(ast, {
      ContractDefinition(node) {

        const name = node.name
        let bases = node.baseContracts.map(spec => {
          return spec.baseName.namePath
        }).join(', ')

        let specs = ''
        if (node.kind === 'library') {
          specs += 'Library'
        } else if (node.kind === 'interface') {
          specs += 'Interface'
        } else {
          specs += 'Implementation'
        }

        contractsTable += `| ${name} | ${specs} | ${bases} |||||
`
      },

      FunctionDefinition(node) {
        const name = node.name || '<fallback>'


        let spec = ''
        if (node.visibility === 'public' || node.visibility === 'default') {
          spec += 'Public'
        } else if (node.visibility === 'external') {
          spec += 'External'
        } else if (node.visibility === 'private') {
          spec += 'Private'
        } else if (node.visibility === 'internal') {
          spec += 'Internal'
        }

        let payable = ''
        if (node.stateMutability === 'payable') {
          payable = '💵'
        }

        let mutating = ''
        if (!node.stateMutability) {
          mutating = '🛑'
        }

        contractsTable += `| └ | - | - | ${name} | ${spec} | ${payable} ${mutating} |`
      },

      'FunctionDefinition:exit': function(node) {
        contractsTable += ` |
`
      },

      ModifierInvocation(node) {
        contractsTable += ` ${node.name}`
      }
    })
  }

  const reportContents = `## Sūrya's Description Report

### Files Description Table

${filesTable}

### Contracts Description Table

${contractsTable}

### Legend

|  Symbol  |  Meaning  |
|:--------:|-----------|
|    🛑    | Function can modify state |
|    💵    | Function is payable |
`
  
  try {
    fs.writeFileSync(outfile, reportContents, {flag: 'w'})
  } catch (err) {
      console.log('Error in writing report file')
      console.log(err)
  }
}
