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

    'ContractDefinition:exit': function(node){
      Object.assign(contractProfile, {stateVarProfiles, functionProfiles})
      contractProfiles.push(contractProfile)
    },

    StateVariableDeclaration(node) {
      let statVarProfile = new Object();
      // The parser returns a 'variables' array here. But is it possible there could ever be 
      // more than one entry? I don't see how.
      let {name, visibility, typeName} = node.variables[0]

      // typeName grammar:
      // https://github.com/solidityj/solidity-antlr4/blob/master/Solidity.g4#L126
      // typeName
      //  : elementaryTypeName // done
      //  | userDefinedTypeName // make visitor
      //  | mapping // tricky, can be nested
      //  | typeName '[' expression? ']' // how to identify this?
      //  | functionTypeName ; // make visitor

      // TODO: create a test contract with a wide range of type declarations. Use that for testing.
      parser.visit(typeName, {
        Mapping(subNode){

          let keyType = subNode.keyType.name
          let valueType
          if (subNode.valueType !== 'Mapping') {
            valueType = subNode.valueType.name
          }

        },
        userDefinedTypeName(subNode){
          console.log('userDefinedTypeName')
        }, 
        functionTypeName(subNode){

        }
      })

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

      functionProfiles.push({name, visibility, mutability})

    }
  })

  return contractProfiles
}

module.exports.contractProfilesFromFile = contractProfilesFromFile