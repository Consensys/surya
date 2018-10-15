"use strict";

const fs = require('fs')
const path = require('path');
const parser = require('solidity-parser-antlr')


/**
 * Given a list of solidity files, returns a list of imports to those files, and all files imported
 * by those files.
 *
 * @param      {Array}   files          files to parse for imports
 * @param      {Set}     importedFiles  files already parsed 
 * @return     {Array}   importPaths    A list of importPaths 
 */
function importProfiler(files, importedFiles = new Set()) {
  for (let file of files){
    // if () skip if it's already in the importedFiles?
    let content
    try {
      content = fs.readFileSync(file).toString('utf-8')
    } catch (e) {
      if (e.code === 'EISDIR') {
        console.error(`Skipping directory ${file}`)
        return importedFiles // empty Set
      } else throw e;
    }
    const ast = parser.parse(content, {tolerant: true})
    
    parser.visit(ast, {
      ImportDirective(node) {
        let importedFile = resolveImportPath(file, node.path)
        importedFiles.add(importedFile)
        importProfiler(importedFile, importedFiles)
      }
    })
    return importedFiles
  }
}

module.exports = importProfiler

/// Takes a filepath, and an import path found within it, and finds the corresponding source code
/// file. Throws an error if the resolved path is not a file.
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


// TODO: find a less insecure way to allow specific import paths
/// starts with a current path, and moves up dirs until it finds node_modules dir
///
/// @param      {<type>}  currentPath  The current path
/// @return     {<type>}  { description_of_the_return_value }
// function findNodeModules(currentPath){
//   let testPath = `${currentPath}/node_modules`
//   if (fs.existsSync(testPath) 
//     && fs.statSync(testPath).isDirectory()
//   ) {
//     return testPath
//   } else {
//     let parentPath = path.resolve(currentPath, '..')
//     if(parentPath === '/') throw new Error('node_modules not found')
//     return findNodeModules(`${parentPath}`)
//   }
// }