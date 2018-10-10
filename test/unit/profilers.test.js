const assert = require('assert');
const { contractProfiler } = require('../../lib/profilers/contractProfiler')
const { systemProfiler } = require('../../lib/profilers/systemProfiler')
const { derivedProfiler } = require('../../lib/profilers/derivedProfiler')

const token = '../contracts/ERC20Token.sol'
const featureful = '../contracts/Featureful.sol'
const inheritor = '../contracts/Inheritor.sol'
// Manually define the expected output for a profile of the 
// Featureful.sol contracts

let expectedFeaturefulProfile = {
  name: Featureful,
  bases: ['Boring'],
  kind: 'contract',
  stateVarProfiles: [
    {name: a, visibility: '', ,typeInfo: { type:bytes32 } },
    ]
  modifierProfiles
  functionProfiles
}



describe('Profilers', function() {
  describe('contractProfiler', function() {
    it.skip('TBD test', function() {


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