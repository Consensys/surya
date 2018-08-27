"use strict";

const profiler = require('./utils/contractProfiler')
const fs = require('fs')
const parser = require('solidity-parser-antlr')
const colors = require('colors')

export function describe(files) {
  for (let file of files) {

    const profiles = profiler.contractProfilesFromFile(file)

    for (let profile of profiles) {

      const name = profile.name
      let bases = profile.bases.join(', ')
      bases = bases.length ? `(${bases})`.gray : ''

      let specs = ''
      if (profile.kind === 'library') {
        specs += '[Lib]'.yellow
      } else if (profile.kind === 'interface') {
        specs += '[Int]'.blue
      }

      console.log(` + ${specs} ${name} ${bases}`)


      for (let functionProfile of profile.functionProfiles) {
        let name

        if (functionProfile.name === 'constructor') {
          name = '<Constructor>'.gray
        } else if (functionProfile.name === 'fallback') {
          name = '<Fallback>'.gray
        } else {
          name = functionProfile.name
        }

        let visibility = ''
        if (functionProfile.visibility === 'public' || functionProfile.visibility === 'default') {
          visibility += '[Pub]'.green
        } else if (functionProfile.visibility === 'external') {
          visibility += '[Ext]'.blue
        } else if (functionProfile.visibility === 'private') {
          visibility += '[Prv]'.red
        } else if (functionProfile.visibility === 'internal') {
          visibility += '[Int]'.gray
        }


        let payable = ''
        if (functionProfile.mutability === 'payable') {
          payable = ' ($)'.yellow
        }
        let mutating = ''
        if (!functionProfile.mutability) {
          // no mutability keyword present, function allows state mutations, but not eth transfers
          mutating = ' #'.red
        } 
        
        console.log(`    - ${visibility} ${name}${payable}${mutating}`)
      }

      console.log('') // space between contracts
    }
  }
}
