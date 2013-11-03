/*
 * findup-sync
 * https://github.com/cowboy/node-findup-sync
 *
 * Copyright (c) 2013 "Cowboy" Ben Alman
 * Licensed under the MIT license.
 */

'use strict';

// Nodejs libs.
var path = require('path');

// External libs.
var glob = require('glob');
var flatten = require('lodash.flatten');
var map = require('lodash.map');
var uniq = require('lodash.uniq');

// Search for a filename in the given directory or all parent directories.
module.exports = function(patterns, options) {
  // Normalize patterns to an array.
  if (!Array.isArray(patterns)) { patterns = [patterns]; }
  // Create globOptions so that it can be modified without mutating the
  // original object.
  var globOptions = Object.create(options || {});
  globOptions.maxDepth = 1;
  globOptions.cwd = path.resolve(globOptions.cwd || '.');

  var files, lastpath;
  do {
    // Search for files matching patterns.
    files = map(patterns, function(pattern) {
      return glob.sync(pattern, globOptions);
    });
    files = flatten(files);
    files = uniq(files);

    // Return file if found.
    if (files.length > 0) {
      return path.resolve(path.join(globOptions.cwd, files[0]));
    }
    // Go up a directory.
    lastpath = globOptions.cwd;
    globOptions.cwd = path.resolve(globOptions.cwd, '..');
  // If parentpath is the same as basedir, we can't go any higher.
  } while (globOptions.cwd !== lastpath);

  // No files were found!
  return null;
};
