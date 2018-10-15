const assert = require('assert')
const fs = require('fs')

const importProfiler = require('../../lib/profilers/importProfiler')

// state variable profiles to match
describe('importProfiler', function() {
  let importProfile
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

  before(function() {
    let tokensFiles = fs.readdirSync(tokensDir).map(entry => `${tokensDir}${entry}`)
    importProfile = importProfiler(tokensFiles)

    assert(typeof importProfile === 'object')
  })   

  it('Lists all files imported by the system', function() {
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
})
