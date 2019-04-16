"use strict";

const fs = require('fs')
const path = require('path');
const parser = require('solidity-parser-antlr')


/// Given a solidity file, returns an array of paths to be imported, by crawling the import graph
/// 
/// @param      {string}  filePath  The file
/// @return     {array}  importPaths A list of importPaths
export function importPathsFromFile(file) {
  let content
  try {
    content = fs.readFileSync(file).toString('utf-8')
  } catch (e) {
    if (e.code === 'EISDIR') {
      console.error(`Skipping directory ${file}`)
    } else throw e;
  }
  // const content = fs.readFileSync(filePath).toString('utf-8')
  const ast = parser.parse(content, {tolerant: true})
  
  let importPaths = new Set()
  parser.visit(ast, {
    ImportDirective(node) {
      let path = resolveImportPath(file, node.path)
      importPaths.add(path)
      // recurse to get a new set, then add each element of the new set
      importPathsFromFile(path).forEach(x => importPaths.add(x))
    }
  })
  return importPaths
}


/// Takes a filepath, and an import path found within it, and finds the corresponding source code
/// file. Throws and error if the resolved path is not a file.
///
/// @param      {<type>}  baseFilePath      The base file path
/// @param      {<type>}  relativeFilePath  The relative file path
///
export function resolveImportPath(basePath, relativePath){
  let resolvedPath;
  let baseDirPath = path.parse(basePath).dir
  // if it's a relative path:
  if (
    relativePath.slice(0,2) === './' 
    || relativePath.slice(0,3) === '../'
    || relativePath.slice(0,1) === '/'
  ) 
  {
    resolvedPath = path.resolve(baseDirPath, relativePath)
  // else it's most likely a special case using a remapping to node_modules dir

  } else {
    let nodeModulesPath = findNodeModules(basePath)
    resolvedPath = path.resolve(nodeModulesPath, relativePath)
  }

  // verify that the resolved path is actually a file
  if (
    !fs.existsSync(resolvedPath) 
    || !fs.statSync(resolvedPath).isFile()
  ) {
    throw new Error(`Import path (${resolvedPath}) not resolved to a file`)
  }
  return resolvedPath
}

/// starts with a current path, and moves up dirs until it finds node_modules dir
///
/// @param      {<type>}  currentPath  The current path
/// @return     {<type>}  { description_of_the_return_value }
function findNodeModules(currentPath){
  let testPath = `${currentPath}/node_modules`
  if (fs.existsSync(testPath) 
    && fs.statSync(testPath).isDirectory()
  ) {
    return testPath
  } else {
    let parentPath = path.resolve(currentPath, '..')
    if(parentPath === '/') throw new Error('node_modules not found')
    return findNodeModules(`${parentPath}`)
  }
}