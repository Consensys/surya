"use strict";

const fs = require('fs')
const parser = require('solidity-parser-antlr')
const path = require('path')
const detectInstalled = require('detect-installed')
const { getInstalledPathSync } = require('get-installed-path')
const moment = require('moment')
//const graphviz = require('graphviz')
//const { linearize } = require('c3-linearization')

let definition = { "contracts": new Array(), "inheritances": new Array(), "uses": new Array() }

export function inherianddepen(files) {
  if (files.length === 0) {
    console.log('No files were specified for analysis in the arguments. Bailing...')
    return
  }

  try {
    for (let file of files) {
      // analyze file
      if (!analyze(file)) continue
    }

    // generate report
    const outputFileName = reportGenerate(definition)

    console.log(JSON.stringify(definition, null, 2))
    console.log()
    console.log("successfully generated!")
    console.log("open " + outputFileName + " in browser")
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}

function analyze(file) {
  let content
  let dependencies = {}
  try {
    content = fs.readFileSync(file).toString('utf-8')
  } catch (e) {
    if (e.code === 'EISDIR') {
      console.error(`Skipping directory ${file}`)
      return false
    } else throw e
  }

  const ast = parser.parse(content)
  let imports = new Map()

  parser.visit(ast, {
    ImportDirective(node) {
      let contractName = path.parse(node.path).name
      let absPath
      if (node.path.startsWith(".")) {
        let currentDir = path.resolve(path.parse(file).dir)
        absPath = path.resolve(path.join(currentDir, node.path))
      } else {
        let modulesInstalledPath = getModulesInstalledPath(node.path)
        let absPathObj = path.parse(modulesInstalledPath + node.path)
        absPath = absPathObj.dir + path.sep + absPathObj.base
      }

      imports.set(contractName, absPath)
    },

    ContractDefinition(node) {
      let contractName = node.name
      if (definition.contracts.indexOf(contractName) === -1) {
        definition.contracts.push(contractName)
      }

      dependencies[contractName] = node.baseContracts.map(spec =>
        spec.baseName.namePath
      )

      for (let i = dependencies[contractName].length - 1; i >= 0; i--) {
        let dep = dependencies[contractName][i]
        if (definition.contracts.indexOf(dep) === -1) {
          definition.contracts.push(dep)
        }

        if (definition.inheritances.indexOf(contractName + "=>" + dep) === -1) {
          definition.inheritances.push(contractName + "=>" + dep)
          if (imports.has(dep)) {
            // recursive
            analyze(imports.get(dep))
          }
        }
      }

      // using list
      let using = []

      // visit contract body
      parser.visit(node.subNodes, {
        // add using declaration
        UsingForDeclaration(node) {
          let libraryName = node.libraryName
          using.push(libraryName)
        },

        // add user defined type contract
        UserDefinedTypeName(node) {
          let namePath = node.namePath
          using.push(namePath)
        }
      })

      for (let dep of using) {
        if (definition.contracts.indexOf(dep) === -1) {
          definition.contracts.push(dep)
        }

        if (definition.uses.indexOf(contractName + "=>" + dep) === -1) {
          definition.uses.push(contractName + "=>" + dep)
          if (imports.has(dep)) {
            // recursive
            analyze(imports.get(dep))
          }
        }
      }
    }
  })
  return true
}

function getModulesInstalledPath(solidityPathStr) { // solidityPathStr is like "openzeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol"
  let [moduleName] = solidityPathStr.split('/', 1)
  let modulesPath = ''

  // check module locally
  if (detectInstalled.sync(moduleName, { local: true })) {
    let localPath = getInstalledPathSync(moduleName, { local: true })
    modulesPath = localPath.replace(moduleName, "")
    // check module globally
  } else if (detectInstalled.sync(moduleName)) {
    const globalPath = getInstalledPathSync(moduleName)
    modulesPath = globalPath.replace(moduleName, "")
  } else {
    throw new Error(`${moduleName} module is not installed`)
  }

  return modulesPath // eg: "/mytruffle_project/node_modules/"
}

function reportGenerate(definition) {
  // remove CR, LE, and space from definition
  const outputJSON = JSON.stringify(definition).replace(/\r|\n|\s/g, '')

  // load jspulub and jquery
  const jsplumbDefaultsCss = fs.readFileSync(__dirname + '/../node_modules/jsplumb/css/jsplumbtoolkit-defaults.css').toString()
  const jsPlumbJs = fs.readFileSync(__dirname + '/../node_modules/jsplumb/dist/js/jsplumb.min.js').toString()
  const jquery = fs.readFileSync(__dirname + '/../node_modules/jquery/dist/jquery.min.js').toString()

  // load template html
  const template = fs.readFileSync(__dirname + '/../resources/template.html').toString()

  // generate file name.
  const m = moment()
  const timestamp = m.format('YYYYMMDDHHmmss')
  const outputFileName = 'inherianddepen_' + timestamp + '.html'

  // generate report
  let output = template.replace(/{{definition}}/g, outputJSON)
  output = output.replace(/{{jsplumbtoolkit-defaults.css}}/g, jsplumbDefaultsCss)
  output = output.replace(/{{jsplumb.min.js}}/g, jsPlumbJs)
  output = output.replace(/{{jquery.min.js}}/g, jquery)
  fs.writeFileSync(process.cwd() + path.sep + outputFileName, output)

  return outputFileName
}