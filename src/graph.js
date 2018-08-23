"use strict";

const parserHelpers = require('./utils/parserHelpers')
const utils = require('./utils/utils')
const fs = require('fs')
const parser = require('solidity-parser-antlr')
const graphviz = require('graphviz')
const { linearize } = require('c3-linearization')
const treeify = require('treeify')


export function graph(files) {
  if (files.length === 0) {
    console.log('No files were specified for analysis in the arguments. Bailing...')
    return
  }
  
  const digraph = graphviz.digraph('G')
  digraph.set('ratio', 'auto')
  digraph.set('page', '100')
  digraph.set('compound', 'true')

  // initialize vars that persist over file parsing loops
  let userDefinedStateVars = {}
  let dependencies = {}
  let fileASTs = new Array()

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

    fileASTs.push(ast)

    let contractName = null
    let cluster = null

    parser.visit(ast, {
      ContractDefinition(node) {
        contractName = node.name

        userDefinedStateVars[contractName] = {}

        let opts = {}

        if(!(cluster = digraph.getCluster(`"cluster${contractName}"`))) {
          cluster = digraph.addCluster(`"cluster${contractName}"`)

          cluster.set('label', contractName)
          cluster.set('color', 'lightgray')
          cluster.set('style', 'filled')

          // opts = {
          //   style: 'invis'
          // }

          // cluster.addNode('anchor' + contractName, opts)
        } else {
          cluster.set('style', 'filled')
        }

        dependencies[contractName] = node.baseContracts.map(spec =>
          spec.baseName.namePath
        )

        // for (let dep of dependencies[contractName]) {
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
        //     ltail: 'cluster' + contractName,
        //     lhead: 'cluster' + dep,
        //     color: 'gray'
        //   }

        //   digraph.addEdge('anchor' + node.name, 'anchor' + dep, opts)
        // }
      },

      StateVariableDeclaration(node) {
        for (let variable of node.variables) {
          if (parserHelpers.isUserDefinedDeclaration(variable)) {
            userDefinedStateVars[contractName][variable.name] = variable.typeName.namePath
          }
        }
      }
    })
  }

  dependencies = linearize(dependencies, {reverse: true})

  for (let ast of fileASTs) {

    let contractName = null
    let cluster = null

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
        contractName = node.name

        cluster = digraph.getCluster(`"cluster${contractName}"`)
      },

      FunctionDefinition(node) {
        let name

        if (node.isConstructor) {
          name = '<Constructor>'
        } else if (!node.name) {
          name = '<Fallback>'
        } else {
          name = node.name
        }
        
        const internal = node.visibility === 'internal'

        let opts = { label: name }

        if (node.visibility === 'public' || node.visibility === 'default') {
          opts.color = 'green'
        } else if (node.visibility === 'external') {
          opts.color = 'blue'
        } else if (node.visibility === 'private') {
          opts.color = 'red'
        } else if (node.visibility === 'internal') {
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
    let tempUserDefinedStateVars = {}

    parser.visit(ast, {
      ContractDefinition(node) {
        contractName = node.name

        for (let dep of dependencies[contractName]) {
          Object.assign(tempUserDefinedStateVars, userDefinedStateVars[dep])
        }

        Object.assign(tempUserDefinedStateVars, userDefinedStateVars[contractName])
      },

      'ContractDefinition:exit': function(node) {
        contractName = null 
        tempUserDefinedStateVars = {}
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
          if (parserHelpers.isUserDefinedDeclaration(parameter)) {
            userDefinedLocalVars[parameter.name] = parameter.typeName.namePath
          }
        }
      },

      VariableDeclaration(node) {
        if (callingScope && parserHelpers.isUserDefinedDeclaration(node)) {
          userDefinedLocalVars[node.name] = node.typeName.namePath
        }
      },

      ModifierInvocation(node) {
        if (callingScope) {
          // digraph.addEdge(callingScope, nodeName(node.name, contractName), { color: 'yellow' })
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
        
        if (parserHelpers.isRegularFunctionCall(node)) {
          opts.color = 'green'
          name = expr.name
        } else if (parserHelpers.isMemberAccess(node)) {
          let object

          name = expr.memberName

          if (expr.expression.hasOwnProperty('name')) {
            object = expr.expression.name

          // checking if it is a member of `address` and pass along it's contents
          } else if (parserHelpers.isMemberAccessOfAddress(node)) {
            if(expr.expression.arguments[0].hasOwnProperty('name')) {
              object = expr.expression.arguments[0].name
            } else {
              object = JSON.stringify(expr.expression.arguments)
            }

          // checking if it is a typecasting to a user-defined contract type
          } else if (parserHelpers.isAContractTypecast(node)) {
            if(expr.expression.expression.hasOwnProperty('name')) {
              object = expr.expression.expression.name
            } else {
              return
            }
          } else {
            return
          }

          if (object === 'this') {
            opts.color = 'green'
          } else if (object === 'super') {
            // "super" in this context is gonna be the 2nd element of the dependencies array
            // since the first is the contract itself
            localContractName = dependencies[localContractName][1]
          } else if (tempUserDefinedStateVars[object] !== undefined) {
            localContractName = tempUserDefinedStateVars[object]
          } else if (userDefinedLocalVars[object] !== undefined) {
            localContractName = userDefinedLocalVars[object]
          } else {
            localContractName = object
          }

        } else {
          return
        }

        let externalCluster

        if(!(externalCluster = digraph.getCluster(`"cluster${localContractName}"`))) {
          externalCluster = digraph.addCluster(`"cluster${localContractName}"`)

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

  // This next block's purpose is to create a legend on the lower left corner
  // of the graph with color information.
  // We'll do it in dot, by hand, because it's overkill to do it programatically.
  // 
  // We'll have to take the last curly bracket of the diagram out before
  // pasting this subgraph and hence the unbalanced brackets
  
  let legendDotString = `

rankdir=LR
node [shape=plaintext]
subgraph cluster_01 { 
label = "Legend";
key [label=<<table border="0" cellpadding="2" cellspacing="0" cellborder="0">
  <tr><td align="right" port="i1">Internal Call</td></tr>
  <tr><td align="right" port="i2">External Call</td></tr>
  <tr><td align="right" port="i3">Defined Contract</td></tr>
  <tr><td align="right" port="i4">Undefined Contract</td></tr>
  </table>>]
key2 [label=<<table border="0" cellpadding="2" cellspacing="0" cellborder="0">
  <tr><td port="i1">&nbsp;&nbsp;&nbsp;</td></tr>
  <tr><td port="i2">&nbsp;&nbsp;&nbsp;</td></tr>
  <tr><td port="i3" bgcolor="lightgray">&nbsp;&nbsp;&nbsp;</td></tr>
  <tr><td port="i4">
    <table border="1" cellborder="0" cellspacing="0" cellpadding="7" color="lightgray">
      <tr>
       <td></td>
      </tr>
     </table>
  </td></tr>
  </table>>]
key:i1:e -> key2:i1:w [color=green]
key:i2:e -> key2:i2:w [color=orange]
}
`
  let finalDigraph = utils.insertBeforeLastOccurrence(digraph.to_dot(), '}', legendDotString)

  console.log(finalDigraph)
}
