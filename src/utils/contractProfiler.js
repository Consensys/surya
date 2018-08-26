"use strict";

const fs = require('fs')
const parser = require('solidity-parser-antlr')

/**
 * Given a solidity file, returns an array of objects, each one representing a contract
 *
 * @param      {string}  file    The file
 * @returns    {array}    contractProfiles A list of objects with details about a given contract
 */ 
function contractProfilesFromFile(file) {
  let contractProfile = new Object() // Info about a contract
  let contractProfiles = new Array() // List of contractProfiles defined in a file
  let functionProfile = new Object() // Info about a function
  let functionProfiles = new Array() // List of functionsProfiles defined in a contract
  let stateVarProfiles = new Array() // List of stateVarProfiles defined in a contract

  const content = fs.readFileSync(file).toString('utf-8')
  const ast = parser.parse(content)

  parser.visit(ast, {
    ContractDefinition(node) {

      let name = node.name
      
      let bases = node.baseContracts.map(spec => {
        return spec.baseName.namePath
      })

      let kind = node.kind

      Object.assign(contractProfile, {name, bases, kind})
    },

    'ContractDefinition:exit': function(node) {
      // Done visiting this contract
      Object.assign(contractProfile, { stateVarProfiles, functionProfiles }) // record function details

      contractProfiles.push(contractProfile) // add to list of contractProfiles
      contractProfile = new Object() // reset the contractProfile object
    },

    StateVariableDeclaration(node) {
      
      // The parser returns a 'variables' array here. But is it possible there could ever be 
      // more than one entry? I don't see how.
      let {name, visibility, typeName} = node.variables[0]
      /*"typeName": {
                  "type": "ElementaryTypeName",
                  "name": "address"
                }
      */

      // if (typeName.type === 'Mapping') {

      // } else if (typeName.type === 'userDefinedTypeName') {
      //   // don't think there's anything to do here.
      // } else if (typeName.type === typeName '[' expression? ']') { // how to check for array pattern in name?

      // } else if (typeName.type.indexof('function')) {

      // } else if (typeName.)

      stateVarProfiles.push({name, visibility, type: typeName.type})
    },
    
    FunctionDefinition(node) {

      let name = ''

      // decided to not add any formatting to constructor or fallback
      if (node.isConstructor) {
        name = 'constructor'
      } else if (!node.name) {
        name = 'fallback'
      } else {
        name = node.name
      }

      // only one visibility keyword is allowed: public, external, internal, private
      let visibility = node.visibility

      // only one mutability keyword is allowed: pure, view, constant, payable
      let mutability = node.stateMutability

      Object.assign(functionProfile, {name, visibility, mutability})

    }, 
    
    'FunctionDefinition:exit': function(node) {
      // Note: I think this can all just be moved up to FunctionDefinition, and then the 
      // profile Object wouldn't even be necessary.
      functionProfiles.push(functionProfile)
      functionProfile = new Object()
    }
  })

  return contractProfiles
}

module.exports.contractProfilesFromFile = contractProfilesFromFile