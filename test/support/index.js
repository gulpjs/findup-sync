"use strict";

const assert = require("node:assert/strict");

const path = require("node:path");
var normalizePath = require("normalize-path");
var resolve = require("resolve");

exports.normalize = function (filepath) {
  return filepath ? normalizePath(path.relative(".", filepath)) : null;
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

exports.assertExtras = {
  isPath(actual) {
    assert.strictEqual(typeof actual, "string");
  },

  toHaveBasename(actual, basename) {
    assert.strictEqual(path.basename(actual), basename);
  },

  toHaveDirname(actual, dirname) {
    assert.strictEqual(
      path.dirname(path.resolve(actual)),
      path.resolve(dirname),
    );
  },
};
