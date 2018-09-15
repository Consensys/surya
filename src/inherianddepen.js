"use strict";

// require section
const parser = require('solidity-parser-antlr');
const fs = require('fs');
const path = require('path');
const dot = require("dot-object");
const moment = require('moment');

// global variables section
let definition;
let projectDir;

// function as entry point
export function inherianddepen(truffleRootDirPath, solidityFilePath) {
  console.log(truffleRootDirPath);
  console.log(solidityFilePath);
  try {
    // generate definition
    const definition = parse(truffleRootDirPath, solidityFilePath);

    // generate report html
    const targetFilePathObj = path.parse(path.resolve(projectDir + path.sep + solidityFilePath));
    const outputFileName = reportGenerate(targetFilePathObj, definition);

    console.log("successfully generated!");
    console.log("open " + outputFileName + " in browser");

  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

function parse(projectDirPath, solFilePath) {
  // truffle path is not set, then throw.
  if (!projectDirPath) throw new Error("Truffle path is required.");

  // truffle project does not exist, then throw
  try {
    fs.accessSync(path.resolve(projectDirPath), fs.constants.F_OK);
  } catch (error) {
    throw new Error(path.resolve(projectDirPath) + " does not exist.");
  }

  // soliditiy file is not set, then throw.
  if (!solFilePath) throw new Error("Solidity file path is required.");

  // solidity absolute path.
  const solAbsPath = projectDirPath + path.sep + solFilePath;


  // solidity file does not exit, then throw
  try {
    fs.accessSync(path.resolve(solAbsPath), fs.constants.F_OK);
  } catch (error) {
    throw new Error(path.resolve(solAbsPath) + " does not exist.");
  }

  // Evaculate projectDirpath
  projectDir = projectDirPath;

  // parse targeFilePath
  const targetFilePathObj = path.parse(path.resolve(solAbsPath));

  // initialize definition
  definition = {};

  // start generating definition
  genDefinition(targetFilePathObj, 0, "");

  return definition;
}

function genDefinition(pathObj, level, prevJsonPath) {

  // read solidity file.
  const input = fs.readFileSync(pathObj.dir + path.sep + pathObj.base, { encoding: 'utf-8' });

  // parse solidity file.
  const result = parser.parse(input);

  // get contract name
  // *Note this tool assume one contract within one solidity file.
  let num = 0;  // if num > 1, error 
  let contractInd;
  for (let i = 0; i < result.children.length; i++) {
    if (result.children[i].type === "ContractDefinition") {
      num++;
      contractInd = i;
    }
  }
  const currentConName = result.children[contractInd].name; // contract name which is being parsed.

  if (num > 1) {
    throw new Error('two definitnions for contracts on ' + currentConName);
  }

  // generate import file paths.
  const importFilePathList = genImportFilePathList(result.children, pathObj);

  // generate super contract list
  const superConList = genSuperConList(result.children)

  // add json to list.
  addJsonToDefinition(prevJsonPath, currentConName, result.children[contractInd], superConList.length, importFilePathList.length);

  // recursive process for super and using contract.
  recursiveProcess(importFilePathList, superConList, level, prevJsonPath);
}

// recursive process for super and using contract.
function recursiveProcess(importFilePathList, superConList, level, prevJsonPath) {
  let usesNum = 0;
  for (let i = 0; i < importFilePathList.length; i++) {
    let isSuper = false;
    for (let j = 0; j < superConList.length; j++) {
      // if this contract is super
      if (importFilePathList[i].name === superConList[j]) {
        let tab = "";
        for (let k = 0; k < level; k++) {
          tab = tab + "  ";
        }

        // recursive for super.
        const supersPath = prevJsonPath === "" ? "supers" : prevJsonPath + ".supers";
        genDefinition(importFilePathList[i].path_obj, level + 1, supersPath + "." + j);

        isSuper = true;
        break;
      }
    }

    // recursive for uses.
    if (isSuper) continue;
    const usesPath = prevJsonPath === "" ? "uses" : prevJsonPath + ".uses";
    genDefinition(importFilePathList[i].path_obj, level + 1, usesPath + "." + usesNum++);
  }
}

function addJsonToDefinition(prevJsonPath, currentConName, target, superConListLen, importFilePathListLen) {
  const addedJSON = {
    "name": currentConName,
    "type": target.type,
    "supers": new Array(superConListLen),
    "uses": new Array(importFilePathListLen - superConListLen)
  };

  if (prevJsonPath === "") {
    definition = addedJSON;
  } else {
    dot.str(prevJsonPath, addedJSON, definition);
  }
}

function genSuperConList(target) {
  let superConList = [];
  target.forEach(ele => {
    if (ele.type === "ContractDefinition") {
      ele.baseContracts.forEach(base => {
        superConList.push(base.baseName.namePath);
      });
    }
  });

  return superConList;
}

function genImportFilePathList(target, path_obj) {
  let importFilePathList = [];
  target.forEach(ele => {
    if (ele.type === "ImportDirective") {
      const ind = ele.path.lastIndexOf('/');
      const conName = ele.path.slice(ind + 1, ele.path.length - 4);
      const d = ele.path.slice(0, ind + 1); // directory path
      let next_abs_path;

      if (d.startsWith(".")) {
        next_abs_path = path.parse(path.resolve(path_obj.dir + path.sep + ele.path));
      } else {
        const installed_project_name_index = ele.path.indexOf('/');
        next_abs_path = path.parse(path.resolve(projectDir + path.sep + "installed_contracts"
          + path.sep
          + ele.path.substr(0,
            installed_project_name_index)
          + path.sep + 'contracts' + path.sep
          + ele.path.substr(installed_project_name_index)));

        // file exist check for installed_contracts.
        try {
          fs.accessSync(next_abs_path.dir + path.sep + next_abs_path.base,
            fs.constants.F_OK,
            (error) => {
              if (error) throw error;
            });
        } catch (e) {
          next_abs_path = path.parse(path.resolve(projectDir + path.sep + "node_modules"
            + path.sep
            + ele.path.substr(0,
              installed_project_name_index)
            + path.sep
            + ele.path.substr(installed_project_name_index)));
        }

      }
      importFilePathList.push({ "name": conName, "fileName": conName + ".sol", "path_obj": next_abs_path });
    }
  });

  return importFilePathList;
}

function reportGenerate(targetFilePathObj, definition) {
  // remove CR, LE, and space from definition
  const outputJSON = JSON.stringify(definition).replace(/\r|\n|\s/g, '');

  // load jspulub and jquery
  const jsplumbDefaultsCss = fs.readFileSync(__dirname + '/../node_modules/jsplumb/css/jsplumbtoolkit-defaults.css').toString();
  const jsPlumbJs = fs.readFileSync(__dirname + '/../node_modules/jsplumb/dist/js/jsplumb.min.js').toString();
  const jquery = fs.readFileSync(__dirname + '/../node_modules/jquery/dist/jquery.min.js').toString();

  // load template html
  const template = fs.readFileSync(__dirname + '/../resources/template.html').toString();

  // generate file name.
  const m = moment();
  const timestamp = m.format('YYYYMMDDHHmmss');
  const outputFileName = targetFilePathObj.name + '_' + timestamp + '.html';

  // generate report
  let output = template.replace(/{{definition}}/g, outputJSON);
  output = output.replace(/{{jsplumbtoolkit-defaults.css}}/g, jsplumbDefaultsCss);
  output = output.replace(/{{jsplumb.min.js}}/g, jsPlumbJs);
  output = output.replace(/{{jquery.min.js}}/g, jquery);
  fs.writeFileSync(process.cwd() + path.sep + outputFileName, output);

  return outputFileName;
}