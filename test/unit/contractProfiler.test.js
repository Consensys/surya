const assert = require('assert')
const fs = require('fs')

const contractProfiler = require('../../lib/profilers/contractProfiler')
const systemProfiler = require('../../lib/profilers/systemProfiler')

const featureful = './test/contracts/Featureful.sol'


// Manually define state variable profiles to match
let valueTypeProfile = { name: 'a', visibility: 'default', typeInfo: { type: 'bytes32' } }
let userDefinedTypeProfile = { name: 'aStruct', visibility: 'default', typeInfo: { type: 'MyType'} }
let fixedArrayProfile = { name: 'fixedArray', visibility: 'default', typeInfo: { type: 'array', fixed: true, length: { type: 'NumberLiteral', number: '21', subdenomination: null},baseType: 'bytes32'}}
let dynArrayProfile = { name: 'dynArray', visibility: 'default', typeInfo: { type: 'array', fixed: false, length: null, baseType: 'MyType'}}
let mappingProfile = { name: 'deposits', visibility: 'default', typeInfo: { type: 'mapping', keyType: 'address', valueType: 'uint256'}}
let mappingToArrayProfile = { name: 'mapsToArray', visibility: 'default', typeInfo: {type: 'mapping', keyType: 'address', valueType: {type: 'array',baseType: 'uint256', fixed: false, length: null}}}
let mappingToMapProfile = { name: 'mapsToMap', visibility: 'default', typeInfo: {type: 'mapping', keyType: 'bytes32','valueType':{type: 'mapping',keyType: 'uint256', valueType: 'bool'}}}

// function profiles to match
let constructorProfile = { name: 'constructor', visibility: 'public', mutability: null, modifierInvocations: [] }
let fooProfile = { name: 'foo', visibility: 'internal', mutability: 'constant', modifierInvocations: ['zounds'] }
let barProfile = { name: 'bar', visibility: 'public', mutability: 'payable', modifierInvocations: [] }
let fallbackProfile = { name: 'fallback', visibility: 'public', mutability: 'payable', modifierInvocations: ['zounds', 'egad'] }

describe('contractProfiler', function() {
  let profiles
  before(function() {
    profiles = contractProfiler([featureful])
    assert(typeof profiles === 'object', typeof profiles)
  })

  it('StorageVars: Accurately profiles a value type', function() {
    assert.deepEqual(profiles[1].stateVarProfiles[0], valueTypeProfile) 
  })

  it('StorageVars: Accurately profiles a user defined struct type', function() {
    assert.deepEqual(profiles[1].stateVarProfiles[3], userDefinedTypeProfile) 
  })

  it('StorageVars: Accurately profiles a fixed array type', function() {
    assert.deepEqual(profiles[1].stateVarProfiles[4], fixedArrayProfile) 
  })

  it('StorageVars: Accurately profiles a dynamic array type', function() {
    assert.deepEqual(profiles[1].stateVarProfiles[5], dynArrayProfile) 
  })

  it('StorageVars: Accurately profiles a mapping type', function() {
    assert.deepEqual(profiles[1].stateVarProfiles[6], mappingProfile) 
  })

  it('StorageVars: Accurately profiles a mapping to an array', function() {
    assert.deepEqual(profiles[1].stateVarProfiles[7], mappingToArrayProfile) 
  })

  it('StorageVars: Accurately profiles a nested mapping', function() {
    assert.deepEqual(profiles[1].stateVarProfiles[8], mappingToMapProfile) 
  })

  it('Modifiers: Gets the correct name for a modifier', function() {
    assert.deepEqual(profiles[1].modifierProfiles[0], {name: 'zounds'}) 
  })

  it('Functions: Accurately profiles the functions', function() {
    assert.deepEqual(profiles[1].functionProfiles[0] , constructorProfile)
    assert.deepEqual(profiles[1].functionProfiles[1] , fooProfile)
    assert.deepEqual(profiles[1].functionProfiles[2] , barProfile)
    assert.deepEqual(profiles[1].functionProfiles[3] , fallbackProfile)
  })
})
