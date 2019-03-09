const { promisify } = require("util");

const fs = require("fs");
const PATH = require("path");
const constants = {
  DIRECTORY: "directory",
  FILE: "file"
};

const readdirAsync = promisify(fs.readdir);
const statAsync = promisify(fs.stat);

async function safeReadDir(path) {
  let dirData = {};
  try {
    dirData = await readdirAsync(path);
  } catch (ex) {
    if (ex.code == "EACCES")
      //User does not have permissions, ignore directory
      return null;
    else throw ex;
  }
  return dirData;
}

/**
 * Normalizes windows style paths by replacing double backslahes with single forward slahes (unix style).
 * @param  {string} path
 * @return {string}
 */
function normalizePath(path) {
  return path.replace(/\\/g, "/");
}

/**
 * Tests if the supplied parameter is of type RegExp
 * @param  {any}  regExp
 * @return {Boolean}
 */
function isRegExp(regExp) {
  return typeof regExp === "object" && regExp.constructor == RegExp;
}

/**
 * Collects the files and folders for a directory path into an Object, subject
 * to the options supplied, and invoking optional
 * @param  {String} path
 * @param  {Object} options
 * @param  {function} onEachFile
 * @param  {function} onEachDirectory
 * @return {Object}
 */
async function directoryTree(
  path,
  options,
  onEachFile,
  onEachDirectory,
  depth = Infinity
) {
  const name = PATH.basename(path);
  path = options && options.normalizePath ? normalizePath(path) : path;
  const item = { path, name };
  let stats;

  try {
    stats = await statAsync(path);
  } catch (e) {
    return null;
  }

  // Skip if it matches the exclude regex
  if (options && options.exclude) {
    const excludes = isRegExp(options.exclude)
      ? [options.exclude]
      : options.exclude;
    if (excludes.some(exclusion => exclusion.test(path))) {
      return null;
    }
  }

  if (stats.isFile()) {
    const ext = PATH.extname(path).toLowerCase();

    // Skip if it does not match the extension regex
    if (options && options.extensions && !options.extensions.test(ext))
      return null;

    item.size = stats.size; // File size in bytes
    item.extension = ext;
    item.type = constants.FILE;

    if (options && options.attributes) {
      options.attributes.forEach(attribute => {
        item[attribute] = stats[attribute];
      });
    }

    if (onEachFile) {
      onEachFile(item, PATH, stats);
    }
  } else if (stats.isDirectory()) {
    let dirData = await safeReadDir(path);
    if (dirData === null) return null;

    if (options && options.attributes) {
      options.attributes.forEach(attribute => {
        item[attribute] = stats[attribute];
      });
    }
    const promises = dirData.map(async child =>
      depth > 0
        ? directoryTree(
            PATH.join(path, child),
            options,
            onEachFile,
            onEachDirectory,
            depth - 1
          )
        : null
    );

    const resolved = await Promise.all(promises);

    item.children = resolved.filter(e => !!e);
    item.size = item.children.reduce((prev, cur) => prev + cur.size, 0);
    item.type = constants.DIRECTORY;
    if (onEachDirectory) {
      onEachDirectory(item, PATH, stats);
    }
  } else return null;

  return item;
}

module.exports = directoryTree;
