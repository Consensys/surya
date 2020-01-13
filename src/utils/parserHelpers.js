"use strict";

const BUILTINS = [
  'gasleft', 'require', 'assert', 'revert', 'addmod', 'mulmod', 'keccak256',
  'sha256', 'sha3', 'ripemd160', 'ecrecover',
]

function isLowerCase(str) {
  return str === str.toLowerCase()
}

const parserHelpers = {
  isRegularFunctionCall: (node, contractNames) => {
    const expr = node.expression
    // @TODO: replace lowercase for better filtering
    return expr.type === 'Identifier'
        && !contractNames.includes(expr.name)
        && !BUILTINS.includes(expr.name)
  },

  isMemberAccess: node => {
    const expr = node.expression
    return expr.type === 'MemberAccess' && !['push', 'pop', 'encode', 'encodePacked', 'encodeWithSelector', 'encodeWithSignature', 'decode'].includes(expr.memberName)
  },

  isIndexAccess: node => {
    const expr = node.expression
    return expr.type === 'IndexAccess'
  },

  isMemberAccessOfAddress: node => {
    const expr = node.expression.expression
    return expr.type === 'FunctionCall'
        && expr.expression.hasOwnProperty('typeName')
        && expr.expression.typeName.name === 'address'
  },

  isAContractTypecast: (node, contractNames) => {
    const expr = node.expression.expression
    // @TODO: replace lowercase for better filtering
    return expr.type === 'FunctionCall'
        && expr.expression.hasOwnProperty('name')
        && contractNames.includes(expr.expression.name[0])
  },

  isUserDefinedDeclaration: node => {
    return node.hasOwnProperty('typeName') && node.typeName.hasOwnProperty('type') && node.typeName.type === 'UserDefinedTypeName'
  },

  isElementaryTypeDeclaration: node => {
    return node.hasOwnProperty('typeName') && node.typeName.hasOwnProperty('type') && node.typeName.type === 'ElementaryTypeName'
  },

  isArrayDeclaration: node => {
    return node.hasOwnProperty('typeName') && node.typeName.hasOwnProperty('type') && node.typeName.type === 'ArrayTypeName'
  },

  isMappingDeclaration: node => {
    return node.hasOwnProperty('typeName') && node.typeName.hasOwnProperty('type') && node.typeName.type === 'Mapping'
  },

  isAddressDeclaration: node => {
    return node.hasOwnProperty('typeName')
        && node.typeName.hasOwnProperty('type')
        && node.typeName.type === 'ElementaryTypeName'
        && node.typeName.name === 'address'
  },
}

module.exports = parserHelpers