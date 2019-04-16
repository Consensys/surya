"use strict";

const fs = require('fs')
const parser = require('solidity-parser-antlr')
const { dependencies } = require('./dependencies')


export function flatten(files, targetContract) {
  if (files.length === 0) {
    console.log('No files were specified for analysis in the arguments. Bailing...')
    return
  }

  if (!targetContract) {
    console.log('No target contract specified in the arguments. Bailing.. ')
    return
  }

  let derivedLinearization = dependencies(files, targetContract)

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


  dependencies = linearize(dependencies, {reverse: true})
  console.log()
  return dependencies[targetContract]
}
