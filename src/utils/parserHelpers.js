"use strict";

const BUILTINS = [
  'gasleft', 'require', 'assert', 'revert', 'addmod', 'mulmod', 'keccak256',
  'sha256', 'sha3', 'ripemd160', 'ecrecover',
]

function isLowerCase(str) {
  return str === str.toLowerCase()
}

const parserHelpers = {
  isRegularFunctionCall: node => {
    const expr = node.expression
    // @TODO: replace lowercase for better filtering
    return expr.type === 'Identifier' && isLowerCase(expr.name[0]) && !BUILTINS.includes(expr.name)
  },

  isMemberAccess: node => {
    const expr = node.expression
    return expr.type === 'MemberAccess' && !['push', 'pop', 'encode', 'encodePacked'].includes(expr.memberName)
  },

  isMemberAccessOfAddress: node => {
    const expr = node.expression.expression
    return expr.type === 'FunctionCall'
        && expr.expression.hasOwnProperty('typeName')
        && expr.expression.typeName.name === 'address'
  },

  isAContractTypecast: node => {
    const expr = node.expression.expression
    // @TODO: replace lowercase for better filtering
    return expr.type === 'FunctionCall'
        && expr.expression.hasOwnProperty('name')
        && !isLowerCase(expr.expression.name[0])
  },

  isUserDefinedDeclaration: node => {
    return node.hasOwnProperty('typeName') && node.typeName.hasOwnProperty('type') && node.typeName.type === 'UserDefinedTypeName'
  },

  isAddressDeclaration: node => {
    return node.hasOwnProperty('typeName')
        && node.typeName.hasOwnProperty('type')
        && node.typeName.type === 'ElementaryTypeName'
        && node.typeName.name === 'address'
  },

  isType: (node, type) => {
    return node.hasOwnProperty('type')
        && node.type === type
  }
}

module.exports = parserHelpers