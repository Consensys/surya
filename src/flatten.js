"use strict";

import { resolve } from 'url';

const fs = require('fs')
const parser = require('solidity-parser-antlr')
const { resolveImportPath } = require('./utils/importHelper')

export function flatten(files) {
  if (!files) {
    console.log('No file was specified for analysis in the arguments. Bailing...')
    return
  }

  // create a set of paths already inserted to pass while flattening each file, to avoid duplication
  let visitedPaths = new Set()
  let flat = ''
  for (let file of files){
    if(visitedPaths.has(file)){
      continue
    }
    let result = replaceImportsWithSource(file, visitedPaths)
    flat += result.flattenedContent
    flat += '\n'
    visitedPaths.add(result.visitedPaths)
  }
  console.log(flat)
}

/**  
 * Given a solidity file, returns the content with imports replaced by source code
 * 
 * @param      {string}  file  The file
 * @param      {Array}   visitedPaths     Paths already resolved
 * @return     {string}  resolvedContent A string with imports replaced by source code
 */
function replaceImportsWithSource(file, visitedPaths = new Set()) {
  let content
  try {
    content = fs.readFileSync(file).toString('utf-8')
  } catch (e) {
    if (e.code === 'EISDIR') {
      console.error(`Skipping directory ${file}`)
    } else throw e;
  }

  const ast = parser.parse(content, {
    loc: true
  })

  let importsAndLocations = [];
  
  parser.visit(ast, {
    ImportDirective(node) {
      let importPath = resolveImportPath(file, node.path)
      importsAndLocations.push({ importPath, location: node.loc })
    }
  })
  
  let contentLines = content.split('\n')
  for (let el of importsAndLocations){
    // array is 0 indexed, file lines are 1 indexed so we need to replace `start.line - 1`
    if (visitedPaths.has(el.importPath)){
      // we've already visited this path, just delete the import statement
      contentLines[el.location.start.line - 1] = ''      
    } else {
      // first time handling this import path, 
      contentLines[el.location.start.line - 1] = 
        `// flattened from: ${el.importPath}  \n ${replaceImportsWithSource(el.importPath, visitedPaths).flattenedContent}`
      visitedPaths.add(el.importPath)
    }
  }
  // let flattenedContent: 
  return {
    flattenedContent: contentLines.join('\n'),
    visitedPaths
  }
}
