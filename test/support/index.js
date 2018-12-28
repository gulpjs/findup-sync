'use strict';

var path = require('path');
var normalizePath = require('normalize-path');
var resolve = require('resolve');
var expect = require('expect');

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

exports.expectExtras = {
  isPath: function() {
    var filepath = this.actual;
    expect(filepath).toExist();
    expect(filepath).toBeA('string');
    return this;
  },
  toHaveBasename: function(basename) {
    var filepath = this.actual;
    expect(filepath).toExist();
    expect(filepath).toBeA('string');
    expect(path.basename(filepath)).toEqual(basename);
    return this;
  },
  toHaveDirname: function(dirname) {
    var filepath = this.actual;
    expect(filepath).toExist();
    expect(filepath).toBeA('string');
    expect(path.dirname(path.resolve(filepath))).toEqual(path.resolve(dirname));
  },
};

