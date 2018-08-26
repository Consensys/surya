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
  let contractProfiles = new Array() // Info about a contract
  let contractProfile = new Object() // List of contractProfiles defined in a file
  let functionProfile = new Object() // Info about a function
  let functionProfiles = new Array() // List of functionsProfiles defined in a contract


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
      Object.assign(contractProfile, { functionProfiles }) // record function details
      contractProfiles.push(contractProfile) // add to list of contractProfiles
      contractProfile = new Object() // reset the contractProfile object
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
      functionProfiles.push(functionProfile)
      functionProfile = new Object() //
    }
  })

  return contractProfiles
}

module.exports.contractProfilesFromFile = contractProfilesFromFile