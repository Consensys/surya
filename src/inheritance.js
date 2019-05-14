"use strict";

const fs = require('fs')
const parser = require('solidity-parser-antlr')
const graphviz = require('graphviz')
const { linearize } = require('c3-linearization')

export function inheritance(files, options = {}) {
  if (files.length === 0) {
    console.log('No files were specified for analysis in the arguments. Bailing...')
    return
  }

  const digraph = graphviz.digraph('G')
  digraph.set('ratio', 'auto')
  digraph.set('page', '40')

  // for draggable
  const definition = { "contracts": new Array(), "inheritances": new Array() }

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

    let contractName = null
    let dependencies = {}

    parser.visit(ast, {
      ContractDefinition(node) {
        contractName = node.name

        if (!digraph.getNode(contractName)) {

          digraph.addNode(contractName)

          // for draggable
          definition.contracts.push(contractName)
        }


        dependencies[contractName] = node.baseContracts.map(spec =>
          spec.baseName.namePath
        )

        for (let dep of dependencies[contractName]) {
          if (!digraph.getNode(dep)) {

            digraph.addNode(dep)

            // for draggable
            definition.contracts.push(dep)
          }

          digraph.addEdge(contractName, dep)

          // for draggable
          definition.inheritances.push(contractName + "=>" + dep)
        }
      }
    })

    dependencies = linearize(dependencies, {reverse: true})
  }

  if (options.draggable) {
    return reportGenerate(definition)
  } else {
    return digraph.to_dot()
  }
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

  // generate report
  let output = template.replace(/{{definition}}/g, outputJSON)
  output = output.replace(/{{jsplumbtoolkit-defaults.css}}/g, jsplumbDefaultsCss)
  output = output.replace(/{{jsplumb.min.js}}/g, jsPlumbJs)
  output = output.replace(/{{jquery.min.js}}/g, jquery)

  return output
}