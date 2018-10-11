const assert = require('assert')
const deepEqual = require('deep-equal')
const fs = require('fs')

const { contractProfiler } = require('../../lib/profilers/contractProfiler')
const { systemProfiler } = require('../../lib/profilers/systemProfiler')
const { derivedProfiler } = require('../../lib/profilers/derivedProfiler')

const featureful = './test/contracts/Featureful.sol'


// Manually define the expected output for profiles

// state variable profiles to match
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

describe('Profilers', function() {
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

  describe('systemProfiler', function() {
    let contractProfiles, inheritanceGraph
    // we'll use openzeppelin's ERC20 dir as a reasonable complex system for testing
    const tokensDir = './node_modules/openzeppelin-solidity/contracts/token/ERC20/'
    // an alphabetically sorted list of all declared contract names found by grepping through the folder:
    let declaredTokens = [ 
      'PausableToken',
      'StandardToken',
      'MintableToken',
      'BasicToken',
      'DetailedERC20',
      'ERC20',
      'ERC20Basic',
      'BurnableToken',
      'StandardBurnableToken',
      'TokenVesting',
      'RBACMintableToken',
      'CappedToken',
      // 'uncomment to make me fail'
    ]

    before(function() {
      let tokensFiles = fs.readdirSync(tokensDir).map(entry => `${tokensDir}${entry}`)
      let systemProfile = systemProfiler(tokensFiles)
      contractProfiles = systemProfile.contractProfiles
      inheritanceGraph = systemProfile.inheritanceGraph

      // console.log(msg)
      assert(typeof contractProfiles === 'object')
      assert(typeof inheritanceGraph === 'object')
    })    
    it('Includes a profile for each contract in the system', function() {
      // convert the array of profiles to just an array of contract names
      let profiledTokens = Object.keys(contractProfiles)

      // check that each token in the system has been accounted for
      for (let token of declaredTokens) {
        let index = profiledTokens.indexOf(token)
        assert(index !== -1, `${token} not found in system profile`)
        // remove that token 
        profiledTokens.splice(index, 1)
      }
      // TODO: this is failing, but rightfully so, because there are imports from beyond the directory.
      assert(profiledTokens.length === 0, `System includes more profiles than expected: ${profiledTokens}`)
    })
  })

  describe('derivedProfiler', function() {
    it.skip('TBD test', function() {
      
    })
  })
})