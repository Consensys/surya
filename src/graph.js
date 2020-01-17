"use strict";

const parserHelpers = require('./utils/parserHelpers')
const utils = require('./utils/utils')
const fs = require('fs')
const parser = require('solidity-parser-diligence')
const graphviz = require('graphviz')
const { linearize } = require('c3-linearization')
const importer = require('../lib/utils/importer')

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
      color: "#445773",
      fontcolor:"#f0f0f0",
      style: "rounded"
    },
    undefined: {
      bgcolor: "#3b4b63",
      color: "#e8726d",
      fontcolor: "#f0f0f0",
      style: "rounded,dashed"
    }
  }

}

export function graph(files, options = {}) {
  if (files.length === 0) {
    // console.log('No files were specified for analysis in the arguments. Bailing...')
    return
  }

  let colorScheme = options.hasOwnProperty('colorScheme') ? options.colorScheme : defaultColorScheme
  
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
  
  // make the files array unique by typecasting them to a Set and back
  // this is not needed in case the importer flag is on, because the 
  // importer module already filters the array internally
  if(!options.contentsInFilePath && options.importer) {
    files = importer.importProfiler(files)
  } else {
    files = [...new Set(files)];
  }

  // initialize vars that persist over file parsing loops
  let userDefinedStateVars = {}
  let stateVars = {}
  let dependencies = {}
  let fileASTs = new Array()
  let functionsPerContract = {}
  let contractUsingFor = {}
  let contractNames = new Array()

  for (let file of files) {

    let content
    if(!options.contentsInFilePath) {
      try {
        content = fs.readFileSync(file).toString('utf-8')
      } catch (e) {
        if (e.code === 'EISDIR') {
          console.error(`Skipping directory ${file}`)
          continue
        } else throw e;
      }
    } else {
      content = file
    }

    const ast = (() => {
      try {
        return parser.parse(content)
      } catch (err) {
        if(!options.contentsInFilePath) {
          console.error(`\nError found while parsing the following file: ${file}\n`)
        } else {
          console.error(`\nError found while parsing one of the provided files\n`)
        }
        throw err;
      }
    })()

    fileASTs.push(ast)

    let contractName = null
    let cluster = null

    parser.visit(ast, {
      ContractDefinition(node) {
        contractName = node.name
        contractNames.push(contractName)
        
        let kind=""
        if (node.kind=="interface"){
          kind="  (iface)"
        } else if(node.kind=="library"){
          kind="  (lib)"
        }

        userDefinedStateVars[contractName] = {}
        stateVars[contractName] = {}
        functionsPerContract[contractName] = new Array()
        contractUsingFor[contractName] = {}

        if(!(cluster = digraph.getCluster(`"cluster${contractName}"`))) {
          cluster = digraph.addCluster(`"cluster${contractName}"`)

          cluster.set('label', contractName + kind)
          cluster.set('color', colorScheme.contract.defined.color)
          if(colorScheme.contract.defined.fontcolor){
            cluster.set('fontcolor', colorScheme.contract.undefined.fontcolor)
          }
          
          if(colorScheme.contract.defined.style){
            cluster.set('style', colorScheme.contract.defined.style || "filled")
            cluster.set('bgcolor', colorScheme.contract.defined.color)
          } 
          else
            cluster.set('style', 'filled')

          colorScheme.contract.defined.bgcolor && cluster.set('bgcolor', colorScheme.contract.defined.bgcolor)
          
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
          } else if (parserHelpers.isElementaryTypeDeclaration(variable)) {
            stateVars[contractName][variable.name] = variable.typeName.name
          } else if (parserHelpers.isArrayDeclaration(variable)) {
            stateVars[contractName][variable.name] = variable.typeName.baseTypeName.namePath
          } else if (parserHelpers.isMappingDeclaration(variable)) {
            stateVars[contractName][variable.name] = variable.typeName.valueType.name
          }
        }
      },

      FunctionDefinition(node) {
        functionsPerContract[contractName].push(node.name)
      },

      UsingForDeclaration(node) {
        contractUsingFor[contractName][node.typeName.name] = node.libraryName
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

    function functionName(node) {
      let name
      if (node.isConstructor) {
        name = '<Constructor>'
      } else if (node.isFallback) {
        name = '<Fallback>'
      } else if (node.isReceiveEther) {
        name = '<Receive Ether>'
      } else {
        name = node.name
      }

      return name
    }

    parser.visit(ast, {
      ContractDefinition(node) {
        contractName = node.name

        cluster = digraph.getCluster(`"cluster${contractName}"`)
      },

      FunctionDefinition(node) {
        const name = functionName(node)

        let opts = { label: name }

        if (node.visibility === 'public' || node.visibility === 'default') {
          opts.color = colorScheme.visibility.public
        } else if (node.visibility === 'external') {
          opts.color = colorScheme.visibility.external
        } else if (node.visibility === 'private') {
          opts.color = colorScheme.visibility.private
        } else if (node.visibility === 'internal') {
          opts.color = colorScheme.visibility.internal
        }

        if(colorScheme.visibility.isFilled){
          if(node.stateMutability==="payable"){
            opts.fillcolor = opts.color
            opts.color = colorScheme.nodeType.payable
          } else {
            opts.fillcolor = opts.color
          }
        }
          
        cluster.addNode(nodeName(name, contractName), opts)
      },

      ModifierDefinition(node) {
        const name = node.name

        let opts = {
          label: name,
          color: colorScheme.nodeType.modifier
        }
        if(colorScheme.nodeType.isFilled){
          opts.fillcolor = opts.color
        }
        if(colorScheme.nodeType.shape){
          opts.shape = colorScheme.nodeType.shape
        }

        cluster.addNode(nodeName(name, contractName), opts)
      }
    })

    let callingScope = null
    let userDefinedLocalVars = {}
    let localVars = {}
    let tempUserDefinedStateVars = {}
    let tempStateVars = {}

    parser.visit(ast, {
      ContractDefinition(node) {
        contractName = node.name

        for (let dep of dependencies[contractName]) {
          Object.assign(tempUserDefinedStateVars, userDefinedStateVars[dep])
          Object.assign(tempStateVars, stateVars[dep])
        }

        Object.assign(tempUserDefinedStateVars, userDefinedStateVars[contractName])
        Object.assign(tempStateVars, stateVars[contractName])
      },

      'ContractDefinition:exit': function(node) {
        contractName = null 
        tempUserDefinedStateVars = {}
        tempStateVars = {}
      },

      FunctionDefinition(node) {
        const name = functionName(node)

        callingScope = nodeName(name, contractName)
      },

      'FunctionDefinition:exit': function(node) {
        callingScope = null 
        userDefinedLocalVars = {}
        localVars = {}
      },

      ModifierDefinition(node) {
        callingScope = nodeName(node.name, contractName)
      },

      'ModifierDefinition:exit': function(node) {
        callingScope = null
      },

      ParameterList(node) {
        for (let parameter of node.parameters) {
          if (parameter.name === null) {
            return
          } else if (parserHelpers.isUserDefinedDeclaration(parameter)) {
            userDefinedLocalVars[parameter.name] = parameter.typeName.namePath
          } else if (callingScope) {
            localVars[parameter.name] = parameter.typeName.name
          }
        }
      },

      VariableDeclaration(node) {
        if (callingScope && node.name === null) {
          return
        } else if (callingScope && parserHelpers.isUserDefinedDeclaration(node)) {
          userDefinedLocalVars[node.name] = node.typeName.namePath
        } else if (callingScope && parserHelpers.isElementaryTypeDeclaration(node)) {
          localVars[node.name] = node.typeName.name
        } else if (callingScope && parserHelpers.isArrayDeclaration(node)) {
          localVars[node.name] = node.typeName.baseTypeName.namePath
        } else if (callingScope && parserHelpers.isMappingDeclaration(node)) {
          localVars[node.name] = node.typeName.valueType.name
        }
      },

      ModifierInvocation(node) {
        if (options.enableModifierEdges && callingScope) {
          digraph.addEdge(callingScope, nodeName(node.name, contractName), { color: 'yellow' })
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
        
        if(
          parserHelpers.isRegularFunctionCall(node, contractNames) &&
          functionsPerContract[contractName].includes(expr.name)
        ) {
          opts.color = colorScheme.call.regular
          name = expr.name
        } else if(parserHelpers.isMemberAccess(node)) {
          let object = null
          let variableType = null

          name = expr.memberName

          
          // checking if the member expression is a simple identifier
          if(expr.expression.hasOwnProperty('name')) {
            object = expr.expression.name

          // checking if it is a member of `address` and pass along it's contents
          } else if(parserHelpers.isMemberAccessOfAddress(node)) {
            if(expr.expression.arguments[0].hasOwnProperty('name')) {
              object = expr.expression.arguments[0].name
            } else if(expr.expression.arguments[0].type === 'NumberLiteral') {
              object = 'address('+expr.expression.arguments[0].number+')'
            } else {
              object = JSON.stringify(expr.expression.arguments).replace(/"/g,"")
            }

          // checking if it is a typecasting to a user-defined contract type
          } else if(parserHelpers.isAContractTypecast(node, contractNames)) {
            object = expr.expression.expression.name
          }

          // check if member expression is a special var and get its canonical type
          if(parserHelpers.isSpecialVariable(expr.expression)) {
            variableType = parserHelpers.getSpecialVariableType(expr.expression)

          // check if member expression is a typecast for a canonical type
          } else if(parserHelpers.isElementaryTypecast(expr.expression)) {
            variableType = expr.expression.expression.typeName.name

          // else check for vars in defined the contract
          } else {
            // check if member access is a function of a "using for" declaration
            // START
            if(localVars.hasOwnProperty(object)) {
              variableType = localVars[object]
            } else if(userDefinedLocalVars.hasOwnProperty(object)) {
              variableType = userDefinedLocalVars[object]
            } else if(tempUserDefinedStateVars.hasOwnProperty(object)) {
              variableType = tempUserDefinedStateVars[object]
            } else if(tempStateVars.hasOwnProperty(object)) {
              variableType = tempStateVars[object]
            }
          }

          // convert to canonical elementary type: uint -> uint256
          variableType = variableType === 'uint' ? 'uint256' : variableType

          // if variable type is not null let's replace "object" for the actual library name
          if(
            variableType !== null &&
            contractUsingFor[contractName].hasOwnProperty(variableType) &&
            functionsPerContract
              .hasOwnProperty(contractUsingFor[contractName][variableType]) &&
            functionsPerContract[
              contractUsingFor[contractName][variableType]
            ].includes(name)
          ) {
            if(!options.libraries) {
              object = contractUsingFor[contractName][variableType]
            } else {
              return
            }
          }
          // END

          // if we have found nothing so far then create no node
          if(object === null) {
            return
          } else if(object === 'this') {
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

        if(!(externalCluster = digraph.getCluster(`"cluster${localContractName}"`))) {
          externalCluster = digraph.addCluster(`"cluster${localContractName}"`)

          externalCluster.set('label', localContractName)
          externalCluster.set('color', colorScheme.contract.undefined.color)
          if(colorScheme.contract.undefined.fontcolor){
            externalCluster.set('fontcolor', colorScheme.contract.undefined.fontcolor)
          }
          if(colorScheme.contract.undefined.style){
            externalCluster.set('style', colorScheme.contract.undefined.style || "filled")
            colorScheme.contract.undefined.bgcolor && externalCluster.set('bgcolor', colorScheme.contract.undefined.bgcolor )
          } 
        }
        

        let localNodeName = nodeName(name, localContractName)

        if (!digraph.getNode(localNodeName) && externalCluster) {
          externalCluster.addNode(localNodeName, { label: name})
        }

        let edge = digraph.addEdge(callingScope, localNodeName, opts)
      }
    })
  }

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
