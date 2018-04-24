"use strict";

const fs = require('fs')
const parser = require('solidity-parser-antlr')
const colors = require('colors')
const treeify = require('treeify')

const BUILTINS = [
  'gasleft', 'require', 'assert', 'revert', 'addmod', 'mulmod', 'keccak256',
  'sha256', 'sha3', 'ripemd160', 'ecrecover',
]

function isLowerCase(str) {
  return str === str.toLowerCase()
}

function isRegularFunctionCall(node) {
  const expr = node.expression
  // @TODO: replace lowercase for better filtering
  return expr.type === 'Identifier' && isLowerCase(expr.name[0]) && !BUILTINS.includes(expr.name)
}

function isMemberAccess(node) {
  const expr = node.expression
  return expr.type === 'MemberAccess' && !['push', 'send'].includes(expr.memberName)
}

function isMemberAccessOfAddress(node) {
  const expr = node.expression.expression
  return expr.type === 'FunctionCall'
      && expr.expression.hasOwnProperty('typeName')
      && expr.expression.typeName.name === 'address'
}

function isUserDefinedDeclaration(node) {
  return node.hasOwnProperty('typeName') && node.typeName.hasOwnProperty('type') && node.typeName.type === 'UserDefinedTypeName'
}

export function ftrace(functionId, files) {
    // let definitionTree = {}
    let callTree = {}

    for (let file of files) {
      const content = fs.readFileSync(file).toString('utf-8')
      const ast = parser.parse(content)

      let contractName = null
      let functionName = null
      let userDefinedStateVars = {}
      let userDefinedLocalVars = {}

      parser.visit(ast, {
        StateVariableDeclaration(node) {
          for (let variable of node.variables) {
            if (isUserDefinedDeclaration(variable)) {
              userDefinedStateVars[variable.name] = variable.typeName.namePath
            }
          }
        }
      })

      parser.visit(ast, {
        ContractDefinition(node) {
          contractName = node.name

          // definitionTree[contractName] = {}
          callTree[contractName] = {}
        },

        'ContractDefinition:exit': function(node) {
          contractName = null
        },

        FunctionDefinition(node) {
          functionName = node.name || '<fallback>'

          console.log(`${functionName} - ${contractName}`)

          callTree[contractName][functionName] = {}

          // let spec = ''
          // if (node.visibility === 'public' || node.visibility === 'default') {
          //   spec += '[Pub]'.red
          // } else if (node.visibility === 'external') {
          //   spec += '[Ext]'.orange
          // } else if (node.visibility === 'private') {
          //   spec += '[Prv]'.blue
          // } else if (node.visibility === 'internal') {
          //   spec += '[Int]'.gray
          // }

          // let payable = ''
          // if (node.stateMutability === 'payable') {
          //   payable = '($)'.green
          // }

          // definitionTree[contractName][nodeName(functionName)] = {
          //   label: `${spec} ${functionName} ${payable}`,
          //   visibility: node.visibility
          // }
        },

        'FunctionDefinition:exit': function(node) {
          functionName = null
          userDefinedLocalVars = {}
        },

        ModifierDefinition(node) {
          functionName = node.name || '<fallback>'

          callTree[contractName][functionName] = {}
        },

        'ModifierDefinition:exit': function(node) {
          functionName = null
        },

        ParameterList(node) {
          for (let parameter of node.parameters) {
            if (isUserDefinedDeclaration(parameter)) {
              userDefinedLocalVars[parameter.name] = parameter.typeName.name
            }
          }
        },

        VariableDeclaration(node) {
          if (functionName && isUserDefinedDeclaration(node)) {
            userDefinedLocalVars[node.name] = node.typeName.namePath
          }
        },

        FunctionCall(node) {
          if (!functionName) {
            // this is a function call outside of functions and modifiers, ignore for now
            return
          }

          const expr = node.expression

          let name
          let localContractName

          if (isRegularFunctionCall(node)) {
            name = expr.name
            localContractName = 'this'
          } else if (isMemberAccess(node)) {
            name = expr.memberName
            localContractName = expr.expression.name

            if (expr.expression.hasOwnProperty('name')) {
              localContractName = expr.expression.name
            } else if (isMemberAccessOfAddress(node)) {
              if(expr.expression.arguments[0].hasOwnProperty('name')) {
                object = expr.expression.arguments[0].name
              } else {
                object = JSON.stringify(expr.expression.arguments)
              }
            } else {
              return
            }

            if (localContractName === 'super' || localContractName === 'this') {
              opts.color = 'green'
            } else if (userDefinedStateVars[localContractName] !== undefined) {
              localContractName = userDefinedStateVars[localContractName]
            } else if (userDefinedLocalVars[localContractName] !== undefined) {
              localContractName = userDefinedLocalVars[localContractName]
            }

          } else {
            return
          }

          if(!callTree[contractName][functionName].hasOwnProperty(name)) {
            callTree[contractName][functionName][name] = {
              contract: localContractName,
              numberOfCalls: 1
            }
          } else {
            callTree[contractName][functionName][name].numberOfCalls++
          }
        }
      })
    }
    // END of file traversing

    console.log( treeify.asTree(callTree, true) )
}
