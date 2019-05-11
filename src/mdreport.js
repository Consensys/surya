"use strict";

const fs = require('fs')
const parser = require('solidity-parser-antlr')
const sha1File = require('sha1-file')

export function mdreport(infiles, options = {}) {
  if (infiles.length === 0) {
    console.log('No files were specified for analysis in the arguments. Bailing...')
    return
  }

  let filesTable = `
|  File Name  |  SHA-1 Hash  |
|-------------|--------------|
`

  let contractsTable = `
|  Contract  |         Type        |       Bases      |                  |                 |
|:----------:|:-------------------:|:----------------:|:----------------:|:---------------:|
|     └      |  **Function Name**  |  **Visibility**  |  **Mutability**  |  **Modifiers**  |
`

  // make the files array unique by typecastign them to a Set and back
  // this is not needed in case the importer flag is on, because the 
  // importer module already filters the array internally
  if(options.importer) {
    infiles = importer.importProfiler(infiles)
  } else {
    infiles = [...new Set(infiles)];
  }

  for (let file of infiles) {
    filesTable += `| ${file} | ${sha1File(file)} |
`

    const content = fs.readFileSync(file).toString('utf-8')
    const ast = parser.parse(content)
    var isPublic = false
    var doesModifierExist = false
    var isConstructor = false;

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

        contractsTable += `||||||
| **${name}** | ${specs} | ${bases} |||
`
      },

      FunctionDefinition(node) {
        let name
        isPublic = false
        doesModifierExist = false
        isConstructor = false

        if (node.isConstructor) {
          isConstructor = true
          name = '\\<Constructor\\>'
        } else if (!node.name) {
          name = '\\<Fallback\\>'
        } else {
          name = node.name
        }


        let spec = ''
        if (node.visibility === 'public' || node.visibility === 'default') {
          spec += 'Public ❗️'
          isPublic = true
        } else if (node.visibility === 'external') {
          spec += 'External ❗️'
          isPublic = true
        } else if (node.visibility === 'private') {
          spec += 'Private 🔐'
        } else if (node.visibility === 'internal') {
          spec += 'Internal 🔒'
        }

        let payable = ''
        if (node.stateMutability === 'payable') {
          payable = '💵'
        }

        let mutating = ''
        if (!node.stateMutability) {
          mutating = '🛑'
        }

        contractsTable += `| └ | ${name} | ${spec} | ${mutating} ${payable} |`
      },

      'FunctionDefinition:exit': function(node) {
        if (!isConstructor && isPublic && !doesModifierExist) {
          contractsTable += 'NO❗️'
        }
        contractsTable += ` |
`
      },

      ModifierInvocation(node) {
        doesModifierExist = true
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
  
  return reportContents
}
