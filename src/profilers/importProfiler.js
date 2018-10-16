"use strict";

const fs = require('fs')
const path = require('path');
const parser = require('solidity-parser-antlr')


/**
 * Given a list of solidity files, returns a list of imports to those files, and all files imported
 * by those files.  For security, this function throws if a path is resolved to a higher level than 
 * projectDir, and it not a file name ending in .sol 
 *
 * @param      {Array}   files          files to parse for imports
 * @param      {string}  projectDir     the highest level directory accessible
 * @param      {Set}     importedFiles  files already parsed 
 * @return     {Array}   importPaths    A list of importPaths 
 */
function importProfiler(files, projectDir = process.cwd(), importedFiles = new Set()) {
  for (let file of files){
    // Checks for a valid solidity file
    file = path.resolve(projectDir, file)
    if (file.indexOf(projectDir) != 0) throw new Error(`
      Imports must be found in sub dirs of the projectDir: ${projectDir}`)
    if (file.slice(-4) !== '.sol') throw new Error('Filenames must end in .sol')
    let content
    try {
      content = fs.readFileSync(file).toString('utf-8')
    } catch (e) {
      if (e.code === 'EISDIR') {
        console.error(`Skipping directory ${file}`)
        return importedFiles // empty Set
      } else throw e;
    }
    // Having verified that it indeed is a solidity file, add it to set of importedFiles
    importedFiles.add(file)
    const ast = parser.parse(content, {tolerant: true})
    
    // create an array to hold the imported files
    const newFiles = new Array()
    parser.visit(ast, {
      ImportDirective(node) {
        let newFile = resolveImportPath(file, node.path)
        newFiles.push(newFile)
      }
    })
    // Run through the array of files found in this file
    importProfiler(newFiles, projectDir, importedFiles)
  }
  // Convert the set to an array for easy consumption
  const importedFilesArray = Array.from(importedFiles)
  return importedFilesArray
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
  ) {
    resolvedPath = path.resolve(baseDirPath, relativeFilePath)
  // else it's most likely a special case using a remapping to node_modules dir
  } else {
    // TODO: handle remappings
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
