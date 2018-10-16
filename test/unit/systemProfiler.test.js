const assert = require('assert')
const fs = require('fs')

const systemProfiler = require('../../lib/profilers/systemProfiler')

// state variable profiles to match

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
    'SafeERC20',
    'TokenTimelock',
    'SafeMath',
    'Ownable',
    'Pausable',
    'RBAC',
    'Roles',
    // 'uncomment to make me fail'
  ]

  before(function() {
    let tokensFiles = fs.readdirSync(tokensDir).map(entry => `${tokensDir}${entry}`)
    let systemProfile = systemProfiler(tokensFiles)

    contractProfiles = systemProfile.contractProfiles
    inheritanceGraph = systemProfile.inheritanceGraph

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
    assert(profiledTokens.length === 0, `System includes more profiles than expected: ${profiledTokens}`)
  })
})
