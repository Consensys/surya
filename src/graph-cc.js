"use strict";

import { type } from 'os';

const parserHelpers = require('./utils/parserHelpers')
const utils = require('./utils/utils')
const fs = require('fs')
const parser = require('solidity-parser-antlr')
const graphviz = require('graphviz')
const { linearize } = require('c3-linearization')

function edgeCountToColor(count, max){
  if (count>max) count=max;

  count = Math.ceil(count/max*100)

  return `#fc${Number(119-count).toString(16)}55`;

}

export const defaultColorScheme = {
  digraph : {
    bgcolor: undefined,
    nodeAttribs : {
    },
    edgeAttribs : {
    }
  },
  visibility : {
    public: "green",
    external: "blue",
    private: "red",
    internal: "white"
  },
  nodeType : {
    modifier: "yellow",
  },
  call : {
    default: "orange",
    regular: "green",
    this: "green"
  },
  contract : {
    defined: {
      bgcolor: "lightgray",
      color: "lightgray",
    },
    undefined: {
      bgcolor: undefined,
      color: "lightgray",
    }
  }
}

export const defaultColorSchemeDark = {
  digraph : {
    bgcolor: "#2e3e56",
    nodeAttribs : {
      style:"filled",
      fillcolor:"#edad56",
      color:"#edad56",
      penwidth:"3"
    },
    edgeAttribs : {
      color:"#fcfcfc", 
      penwidth:"2", 
      fontname:"helvetica Neue Ultra Light"
    }
  },
  visibility : {
    isFilled: true,
    public: "#FF9797",
    external: "#ffbdb9",
    private: "#edad56",
    internal: "#f2c383",
  },
  nodeType : {
    isFilled: false,
    shape: "doubleoctagon",
    modifier: "#1bc6a6",
    payable: "brown",
  },
  call : {
    default: "white",
    regular: "#1bc6a6",
    this: "#80e097"
  },
  contract : {
    defined: {
      bgcolor: "#445773",
      color: "#4f6992",
      fontcolor:"#f0f0f0",
      style: "filled"
    },
    undefined: {
      bgcolor: "#3b4b63",
      color: "#4f6992",
      fontcolor: "#f0f0f0",
      style: "rounded,dashed"
    }
  }

}

export function graphCC(files, options = {}) {
  if (files.length === 0) {
    console.log('No files were specified for analysis in the arguments. Bailing...')
    return
  }

  let colorScheme = options.hasOwnProperty('colorScheme') ? options.colorScheme : defaultColorScheme
  
  let edgeCount = {} // from->to: count 
  let edges = new Array()

  const digraph = graphviz.digraph('G')
  digraph.set('ratio', 'auto')
  digraph.set('page', '100')
  digraph.set('compound', 'true')
  colorScheme.digraph.bgcolor && digraph.set('bgcolor', colorScheme.digraph.bgcolor)
  for(let i in colorScheme.digraph.nodeAttribs){
    digraph.setNodeAttribut(i, colorScheme.digraph.nodeAttribs[i])
  }
  for(let i in colorScheme.digraph.edgeAttribs){
    digraph.setEdgeAttribut(i, colorScheme.digraph.edgeAttribs[i])
  }
  
  // make the files array unique by typecastign them to a Set and back
  // this is not needed in case the importer flag is on, because the 
  // importer module already filters the array internally
  if(options.importer) {
    files = importer.importProfiler(files)
  } else {
    files = [...new Set(files)];
  }

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
        let shape="egg"
        let kind=""
        if (node.kind=="interface"){
          kind="  (iface)"
          shape="rarrow"
        } else if(node.kind=="library"){
          kind="  (lib)"
          shape="box3d"
        }

        userDefinedStateVars[contractName] = {}

      
        if(!(cluster = digraph.getNode(contractName))) {
          cluster = digraph.addNode(contractName)

          

          cluster.set('shape', shape)
          cluster.set('label', contractName + kind)
          cluster.set('color', colorScheme.contract.defined.color)
        
          if(colorScheme.contract.defined.fontcolor){
            cluster.set('fontcolor', colorScheme.contract.defined.fontcolor)
          }
          
          if(colorScheme.contract.defined.style){
            cluster.set('style', colorScheme.contract.defined.style || "filled")
            cluster.set('fillcolor', colorScheme.contract.defined.bgcolor)
          } 
          else
            cluster.set('style', 'filled')

          //colorScheme.contract.defined.bgcolor && cluster.set('bgcolor', colorScheme.contract.defined.bgcolor)
          
        } else {
          if(colorScheme.contract.defined.style)
            cluster.set('style', colorScheme.contract.defined.style)
          else
            cluster.set('style', 'filled')
        }

        dependencies[contractName] = node.baseContracts.map(spec =>
          spec.baseName.namePath
        )
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

    parser.visit(ast, {
      ContractDefinition(node) {
        contractName = node.name

        cluster = digraph.getCluster(`"${contractName}"`)
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
        callingScope = contractName
      },

      'FunctionDefinition:exit': function(node) {
        callingScope = null 
        userDefinedLocalVars = {}
      },

      ModifierDefinition(node) {
        callingScope = contractName
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

      FunctionCall(node) {
        if (!callingScope) {
          // this is a function call outside of functions and modifiers, ignore for now
          return
        }

        const expr = node.expression

        let name
        let localContractName = contractName
        let opts = {
          color: colorScheme.call.default
        }
        
        if (parserHelpers.isRegularFunctionCall(node)) {
          opts.color = colorScheme.call.regular
          name = expr.name
          return  //ignore internal calls
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
            opts.color = colorScheme.call.this
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

        if(!(externalCluster = digraph.getNode(localContractName))) {
          externalCluster = digraph.addNode(localContractName)

          externalCluster.set('label', localContractName)
          externalCluster.set('color', colorScheme.contract.undefined.color)
          externalCluster.set('shape', 'box')
          if(colorScheme.contract.undefined.fontcolor){
            externalCluster.set('fontcolor', colorScheme.contract.undefined.fontcolor)
          }
          if(colorScheme.contract.undefined.style){
            externalCluster.set('style', colorScheme.contract.undefined.style || "filled")
            colorScheme.contract.undefined.bgcolor && externalCluster.set('fillcolor', colorScheme.contract.undefined.bgcolor )
          } 
        }
        

        let edgeKey = `${callingScope}->${localContractName}`
        edgeCount[edgeKey] = (edgeCount[edgeKey] || 0) + 1 

        if(edgeCount[edgeKey]<=1){
          //only add first edge
          edges.push(digraph.addEdge(callingScope, localContractName, opts))
        }
        
      }
    })
  }

  let edgeCountMax = Math.max(...Object.values(edgeCount))

  edges.forEach(e => {
    let edgeKey = `${e.nodeOne.id}->${e.nodeTwo.id}`

    if(edgeCount[edgeKey]>1){
      e.set("color", edgeCountToColor(edgeCount[edgeKey], edgeCountMax))
      e.set("penwidth", Math.ceil(edgeCount[edgeKey]/edgeCountMax * 8))  //max 7
    }
    
  })

  // This next block's purpose is to create a legend on the lower left corner
  // of the graph with color information.
  // We'll do it in dot, by hand, because it's overkill to do it programatically.
  // 
  // We'll have to paste this subgraph before the last curly bracket of the diagram
  
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
  <tr><td port="i3" bgcolor="${colorScheme.contract.defined.bgcolor}">&nbsp;&nbsp;&nbsp;</td></tr>
  <tr><td port="i4">
    <table border="1" cellborder="0" cellspacing="0" cellpadding="7" color="${colorScheme.contract.undefined.color}">
      <tr>
       <td></td>
      </tr>
     </table>
  </td></tr>
  </table>>]
key:i1:e -> key2:i1:w [color="${colorScheme.call.regular}"]
key:i2:e -> key2:i2:w [color="${colorScheme.call.default}"]
}
`
  let finalDigraph = utils.insertBeforeLastOccurrence(digraph.to_dot(), '}', legendDotString)

  return finalDigraph
}
