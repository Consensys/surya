"use strict";

const profiler = require('./utils/contractProfiler')
const fs = require('fs')
const parser = require('solidity-parser-antlr')
const colors = require('colors')

export function describe(files) {
  for (let file of files) {

    const profiles = profiler.contractProfilesFromFile(file)
    // console.log(JSON.stringify(profiles, null, 2))
    for (let profile of profiles) {

      const name = profile.name
      let bases = profile.bases.join(', ')
      bases = bases.length ? `is (${bases})`.gray : ''

      let specs = ''
      if (profile.kind === 'library') {
        specs += '[Lib]'.yellow
      } else if (profile.kind === 'interface') {
        specs += '[Int]'.blue
      }

      // Print contract details:
      console.log(` + ${specs} ${name} ${bases}`)

      // Loop over and print state variable details
      for (let stateVarProfile of profile.stateVarProfiles) {
        let prefix = `<${stateVarProfile.typeInfo.type}>`.red
        console.log(`    - ${prefix} ${stateVarProfile.name}`)
      }
    
      // Loop over and print modifiers:
      for (let modifierProfile of profile.modifierProfiles) {
        let prefix = '(Mod)'.cyan
        console.log(`    - ${prefix} ${modifierProfile.name}`)
      }


      // Loop over and print function details: 
      for (let functionProfile of profile.functionProfiles) {        

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
        let modifiers = ''
        if (functionProfile.modifierInvocations.length > 0){
          for (let modifierInvocation of functionProfile.modifierInvocations) {
            if (!modifiers) {
              modifiers += `${modifierInvocation.cyan}`
            } else {
              modifiers += `, ${modifierInvocation.cyan}`
            }
          }
          // modifiers = `mods( ${modifiers} )` 
        }
        let modifierSignifier = '{'.cyan + '_' + '}'.cyan
       
        console.log(`    - ${visibility} ${name}${payable}${mutating}`)
        if(!!modifiers) {
          console.log(`        - ${modifiers} ${modifierSignifier}`)
        }  
      }

      console.log('') // space between contracts
    }
  }
}
