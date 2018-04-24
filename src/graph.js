"use strict";

const fs = require('fs')
const parser = require('solidity-parser-antlr')
const graphviz = require('graphviz')
const { linearize } = require('c3-linearization')

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

export function graph(files) {
    const digraph = graphviz.digraph('G')
    digraph.set('ratio', 'auto')
    digraph.set('page', '100')
    digraph.set('compound', 'true')

    for (let file of files) {

      let content
      try {
        content = fs.readFileSync(file).toString('utf-8')
      } catch (e) {
        if (e.code === 'EISDIR') {
          console.error(`Skipping directory ${file}`)
          continue
        } else throw e;
      }

      const ast = parser.parse(content)

      let contractName = null
      let cluster = null
      let dependencies = {}
      let userDefinedStateVars = {}

      function nodeName(functionName, contractName) {
        if (dependencies.hasOwnProperty(contractName)) {
          for (let dep of dependencies[contractName]) {
            const name = `${dep}.${functionName}`
            if (digraph.getNode(name)) {
              return name
            }
          }
        }

        return `${contractName}.${functionName}`
      }

      parser.visit(ast, {
        ContractDefinition(node) {
          let opts = {}

          if(!(cluster = digraph.getCluster('cluster' + node.name))) {
            cluster = digraph.addCluster('cluster' + node.name)

            cluster.set('label', node.name)
            cluster.set('color', 'lightgray')
            cluster.set('style', 'filled')

            // opts = {
            //   style: 'invis'
            // }

            // cluster.addNode('anchor' + node.name, opts)
          } else {
            cluster.set('style', 'filled')
          }

          dependencies[node.name] = node.baseContracts.map(spec =>
            spec.baseName.namePath
          )

          // for (let dep of dependencies[node.name]) {
          //   if (!(cluster = digraph.getCluster(dep))) {

          //     cluster = digraph.addCluster('cluster' + dep, opts)

          //   cluster.set('label', dep)
          //   cluster.set('color', 'gray')

          //     opts = {
          //       style: 'invis'
          //     }

          //     cluster.addNode('anchor' + dep, opts)
          //   }

          //   opts = {
          //     ltail: 'cluster' + node.name,
          //     lhead: 'cluster' + dep,
          //     color: 'gray'
          //   }

          //   digraph.addEdge('anchor' + node.name, 'anchor' + dep, opts)
          // }
        },

        StateVariableDeclaration(node) {
          for (let variable of node.variables) {
            if (isUserDefinedDeclaration(variable)) {
              userDefinedStateVars[variable.name] = variable.typeName.namePath
            }
          }
        }
      })

      dependencies = linearize(dependencies)

      parser.visit(ast, {
        ContractDefinition(node) {
          contractName = node.name

          cluster = digraph.getCluster('cluster' + contractName)
        },

        FunctionDefinition(node) {
          const name = node.name || '<fallback>'
          const internal = node.visibility === 'internal'

          let opts = { label: name }
          if (internal) {
            opts.color = 'white'
          }

          cluster.addNode(nodeName(name, contractName), opts)
        },

        ModifierDefinition(node) {
          const name = node.name

          let opts = {
            label: name,
            color: 'yellow'
          }

          cluster.addNode(nodeName(name, contractName), opts)
        }
      })

      let callingScope = null
      let userDefinedLocalVars = {}

      parser.visit(ast, {
        ContractDefinition(node) {
          contractName = node.name
        },

        FunctionDefinition(node) {
          callingScope = nodeName(node.name, contractName)
        },

        'FunctionDefinition:exit': function(node) {
          callingScope = null 
          userDefinedLocalVars = {}
        },

        ModifierDefinition(node) {
          callingScope = nodeName(node.name, contractName)
        },

        'ModifierDefinition:exit': function(node) {
          callingScope = null
        },

        ParameterList(node) {
          for (let parameter of node.parameters) {
            if (isUserDefinedDeclaration(parameter)) {
              userDefinedLocalVars[parameter.name] = parameter.typeName.name
            }
          }
        },

        VariableDeclaration(node) {
          if (callingScope && isUserDefinedDeclaration(node)) {
            userDefinedLocalVars[node.name] = node.typeName.namePath
          }
        },

        FunctionCall(node) {
          if (!callingScope) {
            // this is a function call outside of functions and modifiers, ignore for now
            return
          }

          const expr = node.expression

          let name
          let localContractName = contractName
          let opts = {
            color: 'orange'
          }
          if (isRegularFunctionCall(node)) {
            opts.color = 'green'
            name = expr.name
          } else if (isMemberAccess(node)) {
            let object

            if (expr.expression.hasOwnProperty('name')) {
              object = expr.expression.name

              name = expr.memberName
            } else if (isMemberAccessOfAddress(node)) {
              if(expr.expression.arguments[0].hasOwnProperty('name')) {
                object = expr.expression.arguments[0].name
              } else {
                object = JSON.stringify(expr.expression.arguments)
              }
            } else {
              return
            }

            if (object === 'super' || object === 'this') {
              opts.color = 'green'
            } else if (userDefinedStateVars[object] !== undefined) {
              localContractName = userDefinedStateVars[object]
            } else if (userDefinedLocalVars[object] !== undefined) {
              localContractName = userDefinedLocalVars[object]
            } else {
              localContractName = object
            }

          } else {
            return
          }

          let externalCluster

          if(!(externalCluster = digraph.getCluster('cluster' + localContractName))) {
            externalCluster = digraph.addCluster('cluster' + localContractName)

            externalCluster.set('label', localContractName)
            externalCluster.set('color', 'lightgray')
          }

          let localNodeName = nodeName(name, localContractName)

          if (!digraph.getNode(localNodeName) && externalCluster) {
            externalCluster.addNode(localNodeName, { label: name})
          }

          digraph.addEdge(callingScope, localNodeName, opts)
        }
      })
    }

    console.log(digraph.to_dot())
}
