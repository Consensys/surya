"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.parse = parse;
var fs = require('fs');
var parser = require('@solidity-parser/parser');
var treeify = require('treeify');
var parserHelpers = require('./utils/parserHelpers');

function parse(file) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var callAdditionalInformation = "";
    var content = fs.readFileSync(file).toString('utf-8');
    var ast = function () {
        try {
            return parser.parse(content, { tolerance: options.tolerance, loc: options.location, range: options.range });
        } catch (err) {
            console.log('Error found while parsing the following file: ' + file);
            throw err;
        }
    }();
    if (options.callinfo) {
        var userDefinedStateVars = {};
        var stateVars = {};
        var dependencies = {};
        var fileASTs = [];
        var functionsPerContract = {};
        var eventsPerContract = { '0_global': [] };
        var structsPerContract = { '0_global': [] };
        var contractUsingFor = {};
        var contractNames = ['0_global'];
        var contractName = '0_global';
        parser.visit(ast, {
            ContractDefinition: function ContractDefinition(node) {
                contractName = node.name;
                contractNames.push(contractName);
                userDefinedStateVars[contractName] = {};
                stateVars[contractName] = {};
                functionsPerContract[contractName] = {};
                eventsPerContract[contractName] = [];
                structsPerContract[contractName] = [];
                contractUsingFor[contractName] = {};
            }, 'ContractDefinition:exit': function ContractDefinitionExit(node) {
                contractName = '0_global';
            },

            StateVariableDeclaration: function StateVariableDeclaration(node) {
                var _iteratorNormalCompletion3 = true;
                var _didIteratorError3 = false;
                var _iteratorError3 = undefined;

                try {
                    for (var _iterator3 = node.variables[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                        var variable = _step3.value;

                        if (parserHelpers.isUserDefinedDeclaration(variable)) {
                            userDefinedStateVars[contractName][variable.name] = variable.visibility + " " + variable.typeName.namePath;
                        } else if (parserHelpers.isElementaryTypeDeclaration(variable)) {
                            stateVars[contractName][variable.name] = variable.visibility + " " + variable.typeName.name;
                        } else if (parserHelpers.isArrayDeclaration(variable)) {
                            stateVars[contractName][variable.name] = variable.visibility + " " + variable.typeName.baseTypeName.namePath;
                        } else if (parserHelpers.isMappingDeclaration(variable)) {
                            stateVars[contractName][variable.name] = "mapping (" + variable.typeName.keyType.name + " => " + variable.typeName.valueType.name + ") " + variable.visibility + " " + variable.name;
                        }
                    }
                } catch (err) {
                    _didIteratorError3 = true;
                    _iteratorError3 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion3 && _iterator3.return) {
                            _iterator3.return();
                        }
                    } finally {
                        if (_didIteratorError3) {
                            throw _iteratorError3;
                        }
                    }
                }
            },
            FunctionDefinition: function FunctionDefinition(node) {
                var params = ""
                var returnparams = ""
                if (node.parameters.length != 0) {
                    if (node.parameters.length != 0) {
                        if (parserHelpers.isElementaryTypeDeclaration(node.parameters[0])) {
                            params = node.parameters[0].typeName.name
                        }
                    }
                    for (var i = 1; i < node.parameters.length; i++) {
                        if (parserHelpers.isElementaryTypeDeclaration(node.parameters[i])) {
                            params += ", " + node.parameters[i].typeName.name
                        }
                    }
                }
                if (node.returnParameters != null) {
                    if (node.returnParameters.length != 0) {
                        if (parserHelpers.isElementaryTypeDeclaration(node.returnParameters[0])) {
                            returnparams = node.returnParameters[0].typeName.name
                        }
                    }
                    for (var i = 1; i < node.returnParameters.length; i++) {
                        if (parserHelpers.isElementaryTypeDeclaration(node.returnParameters[i])) {
                            returnparams += ", " + node.returnParameters[i].typeName.name
                        }
                    }
                }
                if (returnparams == "") {
                    returnparams = "void"
                }
                if (node.name == null) {
                    var name = "<init>"
                } else {
                    var name = node.name
                }
                functionsPerContract[contractName][name] = contractName + "." + name + ":" + returnparams + "(" + params + ")";
            },
            EventDefinition: function EventDefinition(node) {
                eventsPerContract[contractName].push(node.name);
            },
            StructDefinition: function StructDefinition(node) {
                structsPerContract[contractName].push(node.name);
            },
            UsingForDeclaration: function UsingForDeclaration(node) {
                var typeNameName = node.typeName != null ? node.typeName.name : '*';

                if (!contractUsingFor[contractName][typeNameName]) {
                    contractUsingFor[contractName][typeNameName] = new Set([]);
                }
                contractUsingFor[contractName][typeNameName].add(node.libraryName);
            }
        });

        for (var i = 1; i < contractNames.length; i++) {
            callAdditionalInformation += contractNames[i] + ";\n";
            callAdditionalInformation += JSON.stringify(stateVars[contractNames[i]]) + ";\n"
            callAdditionalInformation += JSON.stringify(functionsPerContract[contractNames[i]]) + ";\n"
        }
        callAdditionalInformation += ""
    } else {
        callAdditionalInformation += ""
    }
    if (options.jsonOutput) {

        return callAdditionalInformation + JSON.stringify(ast);
    } else {

        return callAdditionalInformation +treeify.asTree(ast, true);
    }
}
