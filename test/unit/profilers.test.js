const assert = require('assert');
const deepEqual = require('deep-equal');
const { contractProfiler } = require('../../lib/profilers/contractProfiler')
const { systemProfiler } = require('../../lib/profilers/systemProfiler')
const { derivedProfiler } = require('../../lib/profilers/derivedProfiler')

const token = './test/contracts/ERC20Token.sol'
const featureful = './test/contracts/Featureful.sol'
const inheritor = './test/contracts/Inheritor.sol'
// Manually define the expected output for a profile of the 
// Featureful.sol gwscontracts

// let expectedFeaturefulProfile = {
//   name: Featureful,
//   bases: ['Boring'],
//   kind: 'contract',
//   stateVarProfiles: [
//     {name: 'a', visibility: '', typeInfo: { type:'bytes32' } },
//     {name: 'blerg', visibility: 'public', typeInfo: { type:'uint256' } },
//     {name: 'ARGGG_GGGH', visibility: '', typeInfo: { type:'bytes32' } },
//     {name: 'aStruct', visibility: '', typeInfo: { type:'MyType' } },
//     {name: 'fixedArray', visibility: '', typeInfo: { type:'bytes32' } },
//     {name: 'dynArray', visibility: '', typeInfo: { type:'bytes32' } },
//     {name: 'deposits', visibility: '', typeInfo: { type:'bytes32' } },
//     {name: 'mapsToArray', visibility: '', typeInfo: { type:'bytes32' } },
//     {name: 'mapsToMap', visibility: '', typeInfo: { type:'bytes32' } },
//     ]
//   modifierProfiles
//   functionProfiles
// }

// various state variable profiles:
let valueTypeProfile = { name: 'a', visibility: 'default', typeInfo: { type:'bytes32' } }
let userDefinedTypeProfile = { name: 'aStruct', visibility: '', typeInfo: { type:'MyType' } }
let fixedArrayProfile = { name: 'fixedArray', visibility: '', typeInfo: { type:'bytes32' } }
let dynArrayProfile = { name: 'dynArray', visibility: '', typeInfo: { type:'bytes32' } }
let mappingProfile = { name: 'deposits', visibility: '', typeInfo: { keyType: 'address', valueType: 'uint256' } }
let mappingToArrayProfile = { name: 'mapsToArray', visibility: '', typeInfo: { type:'bytes32' } }
let mappingToMapProfile = { name: 'mapsToMap', visibility: '', typeInfo: { type:'mapping' } }

describe('Profilers', function() {
  describe('contractProfiler', function() {
    let profiles
    before(function() {
      profiles = contractProfiler([featureful])
      assert(typeof profiles === 'object', typeof profiles)
    })
    it('Accurately profiles a value type', function() {
      assert.deepEqual(profiles[1].stateVarProfiles[0], valueTypeProfile) 
      // this should be the same as assert.deepequal, but it's not
      // deepEqual(profiles[1].stateVarProfiles[0], valueTypeProfile) 
    })
    it.skip('Accurately profiles a user defined type', function() {
      

    })
    it.skip('Accurately profiles an array type', function() {
      

    })
    it.skip('Accurately profiles a mapping type', function() {
      

    })
  })

  describe('systemProfiler', function() {
    it.skip('TBD test', function() {
      
    })
  })

  describe('derivedProfiler', function() {
    it.skip('TBD test', function() {
      
    })
  })
})