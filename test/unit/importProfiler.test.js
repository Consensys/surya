const assert = require('assert')
const fs = require('fs')

const importProfiler = require('../../lib/profilers/importProfiler')

// state variable profiles to match
describe('importProfiler', function() {
  // we'll use openzeppelin's ERC20 dir as a reasonable complex system for testing
  const tokensDir = './node_modules/openzeppelin-solidity/contracts/token/ERC20/'
  // an alphabetically sorted list of all declared contract names found by grepping through the folder:
  let declaredTokens = [ 
  'BasicToken.sol',
  'ERC20Basic.sol',
  'SafeMath.sol',
  'BurnableToken.sol',
  'CappedToken.sol',
  'MintableToken.sol',
  'StandardToken.sol',
  'ERC20.sol',
  'Ownable.sol',
  'DetailedERC20.sol',
  'PausableToken.sol',
  'Pausable.sol',
  'RBACMintableToken.sol',
  'RBAC.sol',
  'Roles.sol',
  'SafeERC20.sol',
  'StandardBurnableToken.sol',
  'TokenTimelock.sol',
  'TokenVesting.sol',
    // 'uncomment to make me fail'
  ]

  it('Lists all files imported by the system', function() {

    let tokensFiles = fs.readdirSync(tokensDir).map(entry => `${tokensDir}${entry}`)
    let importProfile = importProfiler(tokensFiles)

    // convert the array of import paths to just an array of file names
    let files = importProfile.map((path) => path.split('/').pop())
    // check that each file in the system has been accounted for
    for (let token of declaredTokens) {
      let index = files.indexOf(token)
      assert(index !== -1, `${token} not found in the import profile`)
      // remove that token 
      files.splice(index, 1)
    }
    // TODO: this is failing, but rightfully so, because there are imports from beyond the directory.
    assert(files.length === 0, `System includes more profiles than expected: ${files}`)
  })

  it('Throws when trying to access a directory above the provided projectDir', function() {
    let tokensFiles = fs.readdirSync(tokensDir).map(entry => `${tokensDir}${entry}`)
    try {
      let importProfile = importProfiler(tokensFiles, tokensDir)
      assert.fail('No error thrown')
    } catch (e) {
      assert(e.message.indexOf('Imports must be found in sub dirs of the projectDir:') != -1)
    }
  })
})
