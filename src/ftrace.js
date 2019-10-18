"use strict";

const parserHelpers = require('./utils/parserHelpers')
const fs = require('fs')
const parser = require('solidity-parser-antlr')
const { linearize } = require('c3-linearization')
const treeify = require('treeify')


export function ftrace(functionId, accepted_visibility, files, options = {}, noColorOutput = false) {
  if (files.length === 0) {
    return 'No files were specified for analysis in the arguments. Bailing...'
  }

  const [contractToTraverse, functionToTraverse] = functionId.split('::', 2)

  if (contractToTraverse === undefined || functionToTraverse === undefined) {
    return 'You did not provide the function identifier in the right format "CONTRACT::FUNCTION"'
  }

  if (accepted_visibility !== 'all' && accepted_visibility !== 'internal' && accepted_visibility !== 'external') {
    return `The "${accepted_visibility}" type of call to traverse is not known [all|internal|external]`
  }

  let functionCallsTree = {}

  // initialize vars that persist over file parsing loops
  let userDefinedStateVars = {}
  let dependencies = {}
  let modifiers = {}
  let functionDecorators = {}
  let usingForDeclaration = {}

  let fileASTs = new Array()
  let contractASTIndex = {}

  // make the files array unique by typecastign them to a Set and back
  // this is not needed in case the importer flag is on, because the
  // importer module already filters the array internally
  if(options.importer) {
    files = importer.importProfiler(files)
  } else {
    files = [...new Set(files)];
  }

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

    parser.visit(ast, {
      ContractDefinition(node) {
        contractName = node.name

        contractASTIndex[contractName] = fileASTs.length - 1

        userDefinedStateVars[contractName] = {}
        usingForDeclaration[contractName] = {}

        dependencies[contractName] = node.baseContracts.map(spec =>
          spec.baseName.namePath
        )
      },

      UsingForDeclaration(node) {
        let typeName = null
        if (!node.typeName) {
          typeName = "*"
        } else if (parserHelpers.isType(node.typeName, "ElementaryTypeName")) {
          typeName = node.typeName.name
        } else if (parserHelpers.isType(node.typeName, "UserDefinedTypeName")) {
          typeName = node.typeName.namePath
        }

        usingForDeclaration[contractName][typeName] = node.libraryName
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
    constructPerFileFunctionCallTree(ast)
  }
  // END of file traversing

  let touched = {}
  let callTree = {}

  if(!functionCallsTree.hasOwnProperty(contractToTraverse)) {
    return `The ${contractToTraverse} contract is not present in the codebase.`
  } else if (!functionCallsTree[contractToTraverse].hasOwnProperty(functionToTraverse)) {
    return `The ${functionToTraverse} function is not present in ${contractToTraverse}.`
  }

  const seedKeyString = `${contractToTraverse}::${functionToTraverse}`
  touched[seedKeyString] = true
  callTree[seedKeyString] = {}

  // Call with seed
  constructCallTree(contractToTraverse, functionToTraverse, callTree[seedKeyString])

  return treeify.asTree(callTree, true)


  /****************************
   *
   * INTERNAL FUNCTIONS BLOCK
   *
   ****************************/

  function modifierCalls(modifierName, contractName) {
    if (dependencies.hasOwnProperty(contractName)) {
      for (let dep of dependencies[contractName]) {
        if (functionCallsTree[dep].hasOwnProperty(modifierName)) {
          return functionCallsTree[dep][modifierName]
        }
      }
    }

    return functionCallsTree[contractName].hasOwnProperty(modifierName) ?
            functionCallsTree[contractName][modifierName] : {}
  }

  function findImplementation(contracts, name, defaultImplementation) {
    for (let contract of contracts) {
      if (!functionCallsTree.hasOwnProperty(contract))
        constructPerFileFunctionCallTree(fileAST[contractASTIndex[contract]])

      if (functionCallsTree[contract].hasOwnProperty(name)) {
        return contract
      }
    }
    return defaultImplementation
  }

  function constructPerFileFunctionCallTree(ast) {
    let contractName = null
    let functionName = null

    let userDefinedLocalVars = {}
    let tempUserDefinedStateVars = {}

    parser.visit(ast, {
      ContractDefinition(node) {
        contractName = node.name

        functionCallsTree[contractName] = {}
        modifiers[contractName] = {}

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
        if (node.isConstructor) {
          functionName = '<Constructor>'
        } else if (!node.name) {
          functionName = '<Fallback>'
        } else {
          functionName = node.name
        }


        let spec = ''
        if (node.visibility === 'public' || node.visibility === 'default') {
          spec += '[Pub] ❗️'
        } else if (node.visibility === 'external') {
          spec += '[Ext] ❗️'
        } else if (node.visibility === 'private') {
          spec += '[Priv] 🔐'
        } else if (node.visibility === 'internal') {
          spec += '[Int] 🔒'
        }

        let payable = ''
        if (node.stateMutability === 'payable') {
          payable = '💵'
        }

        let mutating = ''
        if (!node.stateMutability) {
          mutating = '🛑'
        }

        functionDecorators[functionName] = ` | ${spec}  ${mutating} ${payable}`

        functionCallsTree[contractName][functionName] = {}
        modifiers[contractName][functionName] = new Array()
      },

      'FunctionDefinition:exit': function(node) {
        functionName = null
        userDefinedLocalVars = {}
      },

      ModifierDefinition(node) {
        functionName = node.name

        functionCallsTree[contractName][functionName] = {}
      },

      'ModifierDefinition:exit': function(node) {
        functionName = null
      },

      ModifierInvocation(node) {
        modifiers[contractName][functionName].push(node.name)
      },

      ParameterList(node) {
        for (let parameter of node.parameters) {
          if (parserHelpers.isUserDefinedDeclaration(parameter)) {
            userDefinedLocalVars[parameter.name] = parameter.typeName.name
          } else if (parserHelpers.isAddressDeclaration(parameter)) {
            // starting name with  "#" because it's an illegal character for naming vars in Solidity
            userDefinedLocalVars[parameter.name] = `#address [${parameter.name}]`
          }
        }
      },

      VariableDeclaration(node) {
        if (functionName && parserHelpers.isUserDefinedDeclaration(node)) {
          userDefinedLocalVars[node.name] = node.typeName.namePath
        } else if (functionName && parserHelpers.isAddressDeclaration(node)) {
          // starting name with  "#" because it's an illegal character for naming vars in Solidity
          userDefinedLocalVars[node.name] = `#address [${node.name}]`
        }
      },

      FunctionCall(node) {
        if (!functionName) {
          // this is a function call outside of functions and modifiers, ignore if exists
          return
        }

        const expr = node.expression

        let name
        let localContractName
        let visibility

        // The following block is a nested switch statement for creation of the call tree
        // START BLOCK
        if (parserHelpers.isRegularFunctionCall(node)) {
          name = expr.name

          localContractName = contractName

          // check if function is implemented in this contract or in any of its dependencies
          if (dependencies.hasOwnProperty(contractName)) {
            localContractName = findImplementation(dependencies[contractName], name, contractName)
          }

          visibility = 'internal'
        } else if (parserHelpers.isMemberAccess(node)) {
          let object

          visibility = 'external'

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

          // Special keywords cases: this, super
          if (object === 'this') {
            if (dependencies.hasOwnProperty(contractName)) {
              localContractName = findImplementation(dependencies[contractName], name, contractName)
            }
          } else if (object === 'super') {
            if (dependencies.hasOwnProperty(contractName)) {
              localContractName = findImplementation(dependencies[contractName].slice(1), name, contractName)
            }
          // the next two cases are checking if any user defined contract variable members were accessed
          } else if (tempUserDefinedStateVars[object] !== undefined) {
            const structName = tempUserDefinedStateVars[object]
            if (structName in usingForDeclaration[contractName]) {
              localContractName = usingForDeclaration[contractName][structName]
            } else if ("*" in usingForDeclaration[contractName]) {
              localContractName = usingForDeclaration[contractName]["*"]
            } else {
              return
            }
          } else if (userDefinedLocalVars[object] !== undefined) {
            localContractName = userDefinedLocalVars[object]
          } else {
            return
            // localContractName = object
          }
        } else {
          return
        }
        // END BLOCK

        if(!functionCallsTree[contractName][functionName].hasOwnProperty(name)) {
          functionCallsTree[contractName][functionName][name] = {
            contract: localContractName,
            numberOfCalls: 1,
            visibility: visibility
          }
        } else {
          functionCallsTree[contractName][functionName][name].numberOfCalls++
        }
      }
    })
  }

  // Function to recursively generate the tree to show in the console
  function constructCallTree(reduceJobContractName, reduceJobFunctionName, parentObject) {
    let tempIterable

    if (functionCallsTree[reduceJobContractName] === undefined ||
      functionCallsTree[reduceJobContractName][reduceJobFunctionName] === undefined) {
      return
    }

    tempIterable = functionCallsTree[reduceJobContractName][reduceJobFunctionName]

    for (const modifier of modifiers[reduceJobContractName][reduceJobFunctionName]) {
      Object.assign(tempIterable, modifierCalls(modifier, reduceJobContractName))
    }

    Object.entries(tempIterable).forEach(([functionCallName, functionCallObject]) => {

      if (
        functionCallName !== 'undefined' && (
          accepted_visibility == 'all' ||
          functionCallObject.visibility == accepted_visibility
        )
      ) {
        let keyString = `${functionCallObject.contract}::${functionCallName}`

        keyString += functionDecorators[functionCallName] === undefined ? '' : functionDecorators[functionCallName]

        if(!noColorOutput && functionCallObject.visibility === 'external' && accepted_visibility !== 'external') {
          keyString = keyString.yellow
        }

        if(touched[keyString] === undefined) {
          parentObject[keyString] = {}
          touched[keyString] = true

          // Test if the call is really to a contract or rather an address variable member access
          // If it is not a contract we should stop here
          if(functionCallObject.contract.substring(0,8) !== '#address') {
            constructCallTree(functionCallObject.contract, functionCallName, parentObject[keyString])
          }
        } else {
          parentObject[keyString] = Object.keys(functionCallsTree[functionCallObject.contract][functionCallName]).length === 0 ?
                                      {} :
                                      noColorOutput ?
                                        '..[Repeated Ref]..' :
                                        '..[Repeated Ref]..'.red
        }
      }
    })
  }

}
