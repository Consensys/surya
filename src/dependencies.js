"use strict";

const fs = require('fs')
const parser = require('solidity-parser-antlr')
const { linearize } = require('c3-linearization')


export function dependencies(files, childContract) {
  if (files.length === 0) {
    console.log('No files were specified for analysis in the arguments. Bailing...')
    return
  }

  if (!childContract) {
    console.log('No child contract specified in the arguments. Bailing.. ')
    return
  }

  // initialize vars that persist over file parsing loops
  let dependencies = {}

  for (let file of files) {

    let content
    try {
      content = fs.readFileSync(file).toString('utf-8')
    } catch (e) {
      if (e.code === 'EISDIR') {
        console.error(`Skipping directory ${file}`)
        continue
      } else throw e;
    }

    const ast = parser.parse(content)

    let contractName = null
    let cluster = null

    parser.visit(ast, {
      ContractDefinition(node) {
        contractName = node.name

        dependencies[contractName] = node.baseContracts.map(spec =>
          spec.baseName.namePath
        )
      }
    })
  }

  if (!dependencies[childContract]) {
    console.log('Specified child contract not found. Bailing.. ')
    return
  }

  dependencies = linearize(dependencies, {reverse: true})

  return dependencies[childContract]
}
