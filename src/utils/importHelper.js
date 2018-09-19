"use strict";

const fs = require('fs')
const path = require('path');
const parser = require('solidity-parser-antlr')


/// Given a solidity file, returns an array of paths to be imported
/// 
/// @param      {string}  filePath  The file
/// @param      {Array}   paths     The paths
/// @return     {array}  importPaths A list of importPaths
function importPathsFromFile(filePath, paths = new Set()) {

  const content = fs.readFileSync(filePath).toString('utf-8')
  const ast = parser.parse(content, {tolerant: true})
  
  parser.visit(ast, {
    ImportDirective(node) {
      let importPath = resolveImportPath(filePath, node.path)
      paths.add(importPath)
      importPathsFromFile(importPath, paths)
    }
  })
  return paths
}


/// Takes a filepath, and an import path found within it, and finds the corresponding source code
/// file. Throws and error if the resolved path is not a file.
///
/// @param      {<type>}  baseFilePath      The base file path
/// @param      {<type>}  relativeFilePath  The relative file path
///
function resolveImportPath(baseFilePath, relativeFilePath){
  let resolvedPath;
  let baseDirPath = path.parse(baseFilePath).dir
  // if it's a relative path:
  if (
    relativeFilePath.slice(0,2) === './' 
    || relativeFilePath.slice(0,3) === '../'
    || relativeFilePath.slice(0,1) === '/'
  ) 
  {
    resolvedPath = path.resolve(baseDirPath, relativeFilePath)
  // else it's most likely a special case using a remapping to node_modules dir

  } else {
    let nodeModulesPath = findNodeModules(baseFilePath)
    resolvedPath = path.resolve(nodeModulesPath, relativeFilePath)
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

module.exports = {
  importPathsFromFile 
}