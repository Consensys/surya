"use strict";

const fs = require('fs')
const parser = require('solidity-parser-antlr')
const path = require('path')
const detectInstalled = require('detect-installed')
const { getInstalledPathSync } = require('get-installed-path')

/**
 * Given a solidity file, returns an array of objects, each one representing a contract
 *
 * @param      {string}  file    The file
 * @returns    {array}    contractProfiles A list of objects with details about a given contract
 */
function contractProfilesFromFile(file) {
  let contractProfiles = new Array()
  let contractProfile = new Object()
  let functionProfile = new Object()
  let functionProfiles = new Array()
  let usingForProfile = new Object()
  let usingForProfiles = new Array()
  let importProfile = new Object()
  let importProfiles = new Array()
  let stateVariableProfile = new Object()
  let stateVariableProfiles = new Array()
  let modifierDefProfile = new Object()
  let modifierDefProfiles = new Array()
  let modifierInvocProfile = new Object()
  let modifierInvocProfiles = new Array()
  let paramListProfile = new Object()
  let paramListProfiles = new Array()
  let varProfile = new Object()
  let varProfiles = new Array()
  let funCallProfile = new Object()
  let funCallProfiles = new Array()

  const content = fs.readFileSync(file).toString('utf-8')
  const ast = parser.parse(content)

  // Object to track which contract definition we are in.


  parser.visit(ast, {
    ContractDefinition(node) {
      // functionProfile = new Object() // Info about the current function definition
      // functionProfiles = new Array() // list of functions defined in this contract

      let name = node.name

      let bases = node.baseContracts.map(spec => {
        return spec.baseName.namePath
      })

      let kind = node.kind
      console.log("-- "+name)
      Object.assign(contractProfile, {name, bases, kind, ast})
    },

    'ContractDefinition:exit': function(node) {
      // Done visiting this contract
      Object.assign(contractProfile, {
        functionProfiles,
        usingForProfiles,
        importProfiles,
        stateVariableProfiles,
        modifierDefProfiles,
        modifierInvocProfiles,
        paramListProfiles,
        varProfiles,
        funCallProfiles
      }) // record function details
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
      functionProfile = new Object()
    },

    UsingForDeclaration(node) {
      let libraryName = node.libraryName
      Object.assign(usingForProfile, {libraryName})
    },
    'UsingForDeclaration:exit': function(node) {
      usingForProfiles.push(usingForProfile)
      usingForProfile = new Object()
    },

    ImportDirective: function(node) {
      let [moduleName, restPart] = node.path.split('/', 2)
      let modulesPath=''

      // check module locally
      if (detectInstalled.sync(moduleName, { local: true })) { // => true
        let localPath = getInstalledPathSync(moduleName, { local: true })
        modulesPath = localPath.replace(moduleName,"")
      // check module globally
      } else if (detectInstalled.sync(moduleName)) { // => true
        const globalPath = getInstalledPathSync(moduleName)
        modulesPath = globalPath.replace(moduleName,"")
      } else {
        console.error(`${moduleName} module is not installed`)
      }

      const [dirName,restDir] = path.dirname(node.path).split('/', 2)
      const [conPath, conName] = file.split('/', 2)

      let lib=''
        if (dirName !== '.' && dirName === moduleName)
          lib = path.join(modulesPath, node.path)
        else
          lib = path.join(conPath, node.path)
      
      const content = fs.readFileSync(lib).toString('utf-8')

      const astImport = parser.parse(content)

      Object.assign(importProfile, {astImport})
    },
    'ImportDirective:exit': function(node) {
      importProfiles.push(importProfile)
      importProfile = new Object()
    },

    StateVariableDeclaration(node) {
      let variables = node.variables
      Object.assign(stateVariableProfile, {variables})
    },
    'StateVariableDeclaration:exit': function(node) {
      stateVariableProfiles.push(stateVariableProfile)
      stateVariableProfile = new Object()
    },

    ModifierDefinition(node) {
      let name = node.name
      Object.assign(modifierDefProfile, {name})
    },
    'ModifierDefinition:exit': function(node) {
      modifierDefProfiles.push(modifierDefProfile)
      modifierDefProfile = new Object()
    },

    ModifierInvocation(node) {
      let name = node.name
      Object.assign(modifierInvocProfile, {name})
    },
    'ModifierInvocation:exit': function(node) {
      modifierInvocProfiles.push(modifierInvocProfile)
      modifierInvocProfile = new Object()
    },

    ParameterList(node) {
      let parameters = node.parameters
      Object.assign(paramListProfile, {parameters})
    },
    'ParameterList:exit': function(node) {
      paramListProfiles.push(paramListProfile)
      paramListProfile = new Object()
    },

    VariableDeclaration(node) {
      let name = node.name
      let nodeTypePath = node.typeName.namePath
      Object.assign(varProfile, {name, nodeTypePath, node})
    },
    'VariableDeclaration:exit': function(node) {
      varProfiles.push(varProfile)
      varProfile = new Object()
    },

  })

  return contractProfiles
}

module.exports.contractProfilesFromFile = contractProfilesFromFile
