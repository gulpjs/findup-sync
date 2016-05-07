'use strict';

var path = require('path');
var normalizePath = require('normalize-path');
var isAbsolute = require('is-absolute');
var resolve = require('resolve');

exports.normalize = function(filepath) {
  return filepath ? normalizePath(path.relative('.', filepath)) : null;
};

exports.chdir = function(dir) {
  // store current cwd
  var orig = process.cwd();
  // set cwd to the given `dir`
  process.chdir(dir);
  return function() {
    // restore original `cwd`
    process.chdir(orig);
  };
};

exports.npm = function npm(name) {
  return path.dirname(resolve.sync(name));
};

exports.assert = function(assert) {
  assert.isPath = function (filepath) {
    assert(filepath);
    assert.equal(typeof filepath, 'string');
  };

  assert.isAbsolute = function (filepath) {
    assert(filepath);
    assert.equal(typeof filepath, 'string');
    assert(isAbsolute(filepath));
  };

  assert.basename = function (filepath, basename) {
    assert(filepath);
    assert.equal(typeof filepath, 'string');
    assert.equal(path.basename(filepath), basename);
  };

  assert.dirname = function (filepath, dirname) {
    assert(filepath);
    assert.equal(typeof filepath, 'string');
    assert.equal(path.dirname(path.resolve(filepath)), path.resolve(dirname));
  };
};

