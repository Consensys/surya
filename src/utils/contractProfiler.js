"use strict";

const fs = require('fs')
const parser = require('solidity-parser-antlr')

/**
  * Given a solidity file, returns an array of objects, each one representing a contract
  *
  * @param      {string}  filePath  The file
  * @return     {array}  contractProfiles A list of objects with details about a given contract
  */ 
module.exports.contractProfilesFromFile = function contractProfilesFromFile(filePath) {
  let contractProfile = new Object() // Info about a contract
  let contractProfiles = new Array() // List of contractProfiles defined in a file
  let modifierProfiles = new Array() // List of modifierProfiles defined in a contract
  let functionProfiles = new Array() // List of functionProfiles defined in a contract
  let stateVarProfiles = new Array() // List of stateVarProfiles defined in a contract

  const content = fs.readFileSync(filePath).toString('utf-8')
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
      Object.assign(contractProfile, {stateVarProfiles, functionProfiles, modifierProfiles})
      contractProfiles.push(contractProfile)
      contractProfile = new Object()
      stateVarProfiles = new Array()
      functionProfiles = new Array()
      modifierProfiles = new Array()
    },

    StateVariableDeclaration(node) {
      let statVarProfile = new Object()
      let {name, visibility, typeName} = node.variables[0]
      let typeInfo = new Object()

      // Define a parser within the parser... 
      parser.visit(typeName, {
        ElementaryTypeName(subNode) {
          typeInfo.type = subNode.name
        },
        Mapping(subNode) { 
          typeInfo.type = 'mapping'
          typeInfo.keyType = subNode.keyType.name // keys are always simple types (uint256, etc)
          typeInfo.valueType = new Object()

          // value in a mapping can be fairly complex, we might not handle all of them here... 
          if (subNode.valueType.type === 'ElementaryTypeName') {
            
            typeInfo.valueType = subNode.valueType.name

          } else if (subNode.valueType.type === 'ArrayTypeName'){
            
            typeInfo.valueType.type = 'array'
            typeInfo.valueType.baseType = subNode.valueType.baseTypeName.name
            typeInfo.valueType.fixed = !!subNode.valueType.length
          
          } else if (subNode.valueType.type === 'Mapping'){
            // We make the (reasonable, but not guaranteed) assumption that a nested mapping has
            // only two levels, and eventually resolves to a simple type
            
            typeInfo.valueType.type = 'mapping'
            typeInfo.valueType.keyType = subNode.valueType.keyType.name
            
            typeInfo.valueType.valueType = subNode.valueType.valueType.name
          }
          // stop the parser from visiting subNodes of this Mapping, which could trigger other visitors
          return false; 
        },
        ArrayTypeName(subNode) {
          typeInfo.type = 'array'
          typeInfo.fixed = !!subNode.length
          typeInfo.baseType = subNode.baseTypeName.type
          return false; 
        },
        userDefinedTypeName(subNode){
          // not sure this actually comes up at the same ast level, I think it's more like where you'd
          // have the 'uint256', or 'bytes32'
          typeInfo.type = 'userDefined'
        }, 
        functionTypeName(subNode) {
          typeInfo.type = subNode.type

        }
      })

      stateVarProfiles.push({name, visibility, typeInfo})
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

      let modifierInvocations = []
      if (node.modifiers) {
        for (let subNode of node.modifiers){
          if (subNode.type === 'ModifierInvocation') {
            modifierInvocations.push(subNode.name)
          }
        }
      }

      let profile = modifierInvocations.length > -1 ? 
        {name, visibility, mutability, modifierInvocations} : {name, visibility, mutability}

      functionProfiles.push(profile)

    },

    ModifierDefinition(node) {
      let name = node.name
      modifierProfiles.push({name})
    }
  })

  return contractProfiles
}
