const core = require('@actions/core');
const { readdirSync, readFileSync, copySync, copy, remove, removeSync } = require('fs-extra');
const yaml = require('js-yaml');

/**
 * Parse YAML Front Matter
 */
function parseFrontMatter(text) {
  const mdArray = text.split('\n');
  let yamlText = '';
  let startFrontMatter = false;
  let endFrontMatter = false;
  for (let i = 0; i < mdArray.length; i++) {
    if (mdArray[i] === '---') {
      if (!startFrontMatter) {
        startFrontMatter = true;
        continue;
      }
      else if (!endFrontMatter) {
        endFrontMatter = true;
        continue;
      }
    }
    if (startFrontMatter && !endFrontMatter) {
      if (yamlText !== '') {
        yamlText += '\n';
      }
      yamlText += mdArray[i];
    }
    else if (endFrontMatter) {
      break;
    }
  }

  try {
    const jsonDoc = yaml.load(yamlText);
    return jsonDoc;
  } catch {
    return undefined;
  }
}

function normalizePath(path) {
  return path.replace(/\\/g, '/');
}

/**
 * Main
 */
try {
  let srcDir = core.getInput('source-dir');
  let dstDir = core.getInput('destination-dir');
  let filterStr = core.getInput('filter-string');

  if (!srcDir) {
    srcDir = 'private';
  }
  if (!dstDir) {
    dstDir = 'public';
  }
  if (!filterStr) {
    filterStr = 'public/';
  }

  removeSync(dstDir);

  /**
   * Copy selected note
   */
  const noteDirs = readdirSync(`./${srcDir}/note/`);
  const notePropsFiltered = [];
  const noteFilteredMap = {};
  for (const noteDir of noteDirs) {
    try {
      const notePropertyYAML = readFileSync(`./${srcDir}/note/${noteDir}/prop.yml`, 'utf8');
      const noteProperty = yaml.load(notePropertyYAML);
      if (noteProperty.name.startsWith(filterStr)) {
        notePropsFiltered.push(noteProperty);
        noteFilteredMap[normalizePath(`${srcDir}/note/${noteDir}`)] = true;
      }
    }
    catch (err) {
      // console.log(err);
    }
  }

  const noteFilterFunc = (src) => {
    src = normalizePath(src);
    if (src === normalizePath(`./${srcDir}/note`)) return true;
    if (noteFilteredMap[src]) return true;
    const srcArray = src.split('/');
    if (srcArray.length > 2
      && noteFilteredMap[normalizePath(srcArray[0] + '/' + srcArray[1] + '/' + srcArray[2])]) return true;
  };
  for (let i = 0; i < notePropsFiltered.length; i++) {
    copySync(`./${srcDir}/note`, `./${dstDir}/note/`, { filter: noteFilterFunc });
  }


  /**
   * Copy selected card
   */

  for (let i = 0; i < notePropsFiltered.length; i++) {
    const noteProp = notePropsFiltered[i];
    const noteDir = `./${srcDir}/${noteProp._id.replace('/prop', '/')}`;
    const cardSketchDirs = readdirSync(noteDir);
    for (const cardSketchFile of cardSketchDirs) {
      if (cardSketchFile === 'prop.yml') continue;
      try {
        if (cardSketchFile.match(/^c\d\d\d\d-\d\d-\d\d-\d\d-\d\d-\d\d-.+\.yml$/)) {
          const cardName = `${cardSketchFile.replace('.yml', '.md')}`;
          copy(`./${srcDir}/card/${cardName}`, `./${dstDir}/card/${cardName}`);
        }
      }
      catch (err) {
        // console.log(err);
      }
    }
  }

  /**
   * Copy selected snapshot
   */

  const snapshotFiles = readdirSync(`./${srcDir}/snapshot/`);
  const snapshotFilteredMap = {};
  for (const snapshotFile of snapshotFiles) {
    try {
      const snapshotPropertyYFMMD = readFileSync(`./${srcDir}/snapshot/${snapshotFile}`, 'utf8');
      const snapshotProperty = parseFrontMatter(snapshotPropertyYFMMD);
      if (snapshotProperty !== undefined && snapshotProperty.name.startsWith(filterStr)) {
        snapshotFilteredMap[normalizePath(`${srcDir}/${snapshotProperty._id}.md`)] = true;
      }
    }
    catch (err) {
      // console.log(err);
    }
  }
  const snapshotFilterFunc = (src) => {
    src = normalizePath(src);
    if (src === normalizePath(`./${srcDir}/snapshot`)) return true;
    if (snapshotFilteredMap[src]) return true;
    const srcArray = src.split('/');
    if (srcArray.length > 2
      && snapshotFilteredMap[normalizePath(srcArray[0] + '/' + srcArray[1] + '/' + srcArray[2])]) return true;
  };
  copySync(`./${srcDir}/snapshot`, `./${dstDir}/snapshot/`, { filter: snapshotFilterFunc });

} catch (error) {
  core.setFailed(error.message);
}
