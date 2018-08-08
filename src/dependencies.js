"use strict";

const fs = require('fs')
const parser = require('solidity-parser-antlr')
const colors = require('colors')
const { linearize } = require('c3-linearization')
const treeify = require('treeify')


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
  }

  dependencies = linearize(dependencies, {reverse: true})

  let derivedLinearization = dependencies[childContract]
  console.log(derivedLinearization[0].yellow)
  
  if (derivedLinearization.length < 2) {
    console.log('No Dependencies Found')
    return
  }
  derivedLinearization.shift()

  const reducer = (accumulator, currentValue) => `${accumulator}\n  ↖ ${currentValue}`
  console.log(`  ↖ ${derivedLinearization.reduce(reducer)}`)

}
