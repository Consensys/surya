"use strict";

const fs = require('fs')
const parser = require('solidity-parser-antlr')

const contractProfilesFromFile = require('./contractProfiler').contractProfilesFromFile
const importPathsFromFile = require('./importHelper').importPathsFromFile 


// module.exports.derivedProfileFromFile = 
function derivedProfileFromFile(file) {
  let paths = importPathsFromFile(file);
  return paths
}

console.log(derivedProfileFromFile(process.argv[2]))




// const derived = {
//   'path/to/some/file' :  {
//     importedPaths: ['path/to/some/file2', ...],
//     importedContracts: { // used to check that the inherited contract is imported
//       contractNameJ: {contractProfile},
//       contractNameK: {contractProfile}
//     }, 
//     contractsDefined: { // These are the contracts we have on hand... 
//       contractNameA: {contractProfile}
//       contractNameB: {contractProfile}
//     }
//   }
// }