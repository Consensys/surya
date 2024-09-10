"use strict";

const fs = require('fs');
const path = require('path');
const parser = require('@solidity-parser/parser');

/**
 * Given a list of Solidity files, returns a list of imports from those files and all files imported by those files.
 * This function throws an error if a path is resolved to a higher level than projectDir and if it's not a .sol file.
 *
 * @param {Array}   files          - Solidity files to parse for imports.
 * @param {string}  projectDir     - The highest level directory accessible.
 * @param {Set}     importedFiles  - Files already parsed.
 * @returns {Array} importPaths    - A list of importPaths.
 */
export function importProfiler(files, projectDir = process.cwd(), importedFiles = new Set()) {
  for (let file of files) {
    // Check for a valid Solidity file.
    file = path.resolve(projectDir, file);
    if (file.indexOf(projectDir) !== 0 || !file.endsWith('.sol')) {
      throw new Error(`Invalid import path: ${file}`);
    }
    let content;
    try {
      content = fs.readFileSync(file, 'utf-8');
    } catch (e) {
      if (e.code === 'EISDIR') {
        console.error(`Skipping directory: ${file}`);
        return importedFiles; // Empty Set
      } else {
        throw e;
      }
    }
    // Add the valid Solidity file to the set of importedFiles.
    importedFiles.add(file);
    const ast = (() => {
      try {
        return parser.parse(content, { tolerant: true });
      } catch (err) {
        console.error(`Error found while parsing file: ${file}\n`);
        throw err;
      }
    })();

    // Create an array to hold the imported files.
    const newFiles = [];
    parser.visit(ast, {
      ImportDirective(node) {
        let newFile = resolveImportPath(file, node.path, projectDir);
        if (!importedFiles.has(newFile)) newFiles.push(newFile);
      }
    });
    // Recursively process the array of imported files.
    importProfiler(newFiles, projectDir, importedFiles);
  }
  // Convert the set to an array for easy consumption.
  const importedFilesArray = Array.from(importedFiles);
  return importedFilesArray;
}

/**
 * Takes a filepath, an import path found within it, and finds the corresponding source code file.
 * Throws an error if the resolved path is not a file.
 *
 * @param {string} baseFilePath      - The base file path.
 * @param {string} importedFilePath  - The imported file path.
 * @param {string} projectDir        - The top-most directory to search in.
 * @returns {string} resolvedPath   - The resolved file path.
 */
export function resolveImportPath(baseFilePath, importedFilePath, projectDir = process.cwd()) {
  // Split the project directory path.
  const topmostDirArray = projectDir.split(path.sep);
  let resolvedPath;
  let baseDirPath = path.dirname(baseFilePath);

  // If it's a relative or absolute path:
  if (importedFilePath.slice(0, 1) === '.' || importedFilePath.slice(0, 1) === '/') {
    resolvedPath = path.resolve(baseDirPath, importedFilePath);
  } else {
    // It's most likely a special case using a remapping to node_modules directory.
    let currentDir = path.resolve(baseDirPath, '..');
    let currentDirArray = baseDirPath.split(path.sep);
    let currentDirName = currentDirArray.pop();
    let nodeModulesDir = '';

    while (!fs.readdirSync(currentDir).includes('node_modules') && !nodeModulesDir) {
      if (topmostDirArray.length >= currentDirArray.length) {
        throw new Error(`Import statement seems to be a Truffle "node_modules remapping," but no 'node_modules' directory could be found.`);
      }
      currentDirName = currentDirArray.pop();
      currentDir = path.resolve(currentDir, '..');
    }

    // We've found the directory containing node_modules.
    nodeModulesDir = path.join(currentDir, 'node_modules');
    resolvedPath = path.join(nodeModulesDir, importedFilePath);
  }

  // Verify that the resolved path is actually a file.
  if (!fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isFile()) {
    throw new Error(`Import path not resolved to a file: ${resolvedPath}`);
  }

  return resolvedPath;
}
