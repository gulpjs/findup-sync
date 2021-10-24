'use strict';

var path = require('path');
var normalizePath = require('normalize-path');
var resolve = require('resolve');

exports.normalize = function (filepath) {
  return filepath ? normalizePath(path.relative('.', filepath)) : null;
};

exports.chdir = function (dir) {
  // store current cwd
  var orig = process.cwd();
  // set cwd to the given `dir`
  process.chdir(dir);
  return function () {
    // restore original `cwd`
    process.chdir(orig);
  };
};

exports.npm = function npm(name) {
  return path.dirname(resolve.sync(name));
};

function matcherResult(pass, msg) {
  return {
    pass: pass,
    message: function () {
      return msg;
    },
  };
}

exports.expectExtras = {
  isPath: function (actual) {
    if (typeof actual === 'string') {
      return matcherResult(true, '');
    }
    return matcherResult(false, '"' + actual + '" is not a string');
  },
  toHaveBasename: function (actual, basename) {
    var fileName = path.basename(actual);
    if (fileName === basename) {
      return matcherResult(true, '');
    }
    return matcherResult(
      false,
      'The basename of "' + actual + '" is not equal to "' + basename + '".'
    );
  },
  toHaveDirname: function (actual, dirname) {
    var filePath = path.dirname(path.resolve(actual));
    var expected = path.resolve(dirname);
    if (filePath === expected) {
      return matcherResult(true, '');
    }
    return matcherResult(
      false,
      'The direname of "' + actual + '" is not equal to "' + expected + '".'
    );
  },
};
