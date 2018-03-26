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

export function graph(files) {
    const digraph = graphviz.digraph('G')
    digraph.set('ratio', 'auto')
    digraph.set('page', '11,17')

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

      function nodeName(functionName) {
        for (let dep of dependencies[contractName]) {
          const name = `${dep}.${functionName}`
          if (digraph.getNode(name)) {
            return name
          }
        }
        return `${contractName}.${functionName}`
      }

      parser.visit(ast, {
        ContractDefinition(node) {
          contractName = node.name

          dependencies[contractName] = node.baseContracts.map(spec =>
            spec.baseName.namePath
          )

          cluster = digraph.addCluster('cluster' + contractName)
          cluster.set('label', contractName)
        },

        FunctionDefinition(node) {
          const name = node.name || '<fallback>'
          const internal = node.visibility === 'internal'

          let opts = { label: name }
          if (internal) {
            opts.color = 'gray'
          }

          cluster.addNode(nodeName(name), opts)
        }
      })

      dependencies = linearize(dependencies)

      let callingScope = null

      parser.visit(ast, {
        ContractDefinition(node) {
          contractName = node.name
        },

        FunctionDefinition(node) {
          callingScope = nodeName(node.name)
        },

        'FunctionDefinition:exit': function(node) {
          callingScope = null
        },

        FunctionCall(node) {
          if (!callingScope) {
            // this must be a function call inside a modifier, ignore for now
            return
          }

          const expr = node.expression

          let name
          if (isRegularFunctionCall(node)) {
            name = expr.name
          } else if (isMemberAccess(node)) {
            name = `${expr.expression.name}.${expr.memberName}`
          } else {
            return
          }

          digraph.addEdge(callingScope, nodeName(name))
        }
      })
    }

    console.log(digraph.to_dot())
}
