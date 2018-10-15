"use strict";

const contractProfiler = require('./profilers/contractProfiler')
const fs = require('fs')
const parser = require('solidity-parser-antlr')
const colors = require('colors')

export function describe(files, options) {

  const profiles = contractProfiler(files)
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
    if(options.storage) {
      for (let varProfile of profile.stateVarProfiles) {
        let prefix 
        
        if (varProfile.typeInfo.type === 'mapping') {
          let keyType = varProfile.typeInfo.keyType
          let valueType = varProfile.typeInfo.valueType
          
          if(typeof valueType === 'string') {
            prefix = `map(${keyType} -> ${valueType})`

          } else if(valueType.type === 'array') {
            let length = !valueType.length ? '' : valueType.length 
            prefix = `map(${keyType} -> ${valueType.baseType}[${length}])`
          
          } else if(valueType.type === 'mapping') {
            prefix = `map(${keyType} -> map(${valueType.keyType} -> ${valueType.valueType}))`
          
          }
        
        } else if(varProfile.typeInfo.type === 'array') {
          // console.log(JSON.stringify(varProfile.typeInfo))
          let length = varProfile.typeInfo.length ? 
            varProfile.typeInfo.length.number : ''
          prefix = `${varProfile.typeInfo.baseType}[${length}]`
        
        } else {
          prefix = varProfile.typeInfo.type
        }

        prefix = `${prefix}`.red
        console.log(`    - ${prefix} ${varProfile.name}`)
      }
    }    


    // Loop over and print modifiers:
    if(options.modifiers) {
      for (let modifierProfile of profile.modifierProfiles) {
        let prefix = '(Mod)'.cyan
        console.log(`    - ${prefix} ${modifierProfile.name}`)
      }
    }


    // Loop over and print function details: 
    if(options.functions) {
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
        console.log(`    - ${visibility} ${name}${payable}${mutating}`)
        
        if(options.modifiers){
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
          let modifierSignifier = '{'.cyan + '_;' + '}'.cyan
         
          if(!!modifiers) {
            console.log(`        - ${modifiers} ${modifierSignifier}`)
          }  
        }
      }  
    } 

    console.log('') // space between contracts
  }
}
