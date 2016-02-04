'use strict';

require('mocha');
require('should');
var fs = require('fs');
var path = require('path');
var assert = require('assert');
var resolve = require('resolve');
var expand = require('resolve-dir');
var isAbsolute = require('is-absolute');
var norm = require('normalize-path');
var home = require('user-home');
var argv = require('minimist')(process.argv.slice(2));
var lookup = require('../');
var cwd, actual, opts;

if (argv.bench) {
  var b = path.join(__dirname, 'benchmark/code', argv.bench);
  console.log(b);
  lookup = require(b);
}

assert.isPath = function (fp, basename) {
  assert(fp);
  assert.equal(typeof fp, 'string');
};

assert.isAbsolute = function (fp) {
  assert(fp);
  assert(isAbsolute(fp));
};

assert.exists = function (fp) {
  assert(fp);
  try {
    fs.statSync(fp);
  } catch(err) {
    assert(fp, err);
  }
};

assert.basename = function (fp, basename) {
  assert(fp);
  assert.equal(path.basename(fp), basename);
};

assert.dirname = function (fp, dirname) {
  assert(fp);
  assert.equal(path.dirname(path.resolve(fp)), path.resolve(dirname));
};

function npm(name) {
  return path.dirname(resolve.sync(name));
}

describe('lookup', function () {
  before(function () {
    fs.writeFileSync(home + '/_aaa.txt', '');
    fs.writeFileSync(home + '/_bbb.txt', '');
  });
  after(function () {
    fs.unlinkSync(home + '/_aaa.txt');
    fs.unlinkSync(home + '/_bbb.txt');
  });

  it('should throw when the first arg is not a string or array:', function () {
    (function() {
      lookup();
    }).should.throw('findup-sync expects a string or array as the first argument.')
  });

  it('should work when no cwd is given', function () {
    var actual = lookup('package.json');
    assert(actual);
    assert.dirname(actual, path.resolve(__dirname, '..'));
    assert.basename(actual, 'package.json');
  });

  it('should support normal (non-glob) file paths:', function () {
    cwd = path.dirname(resolve.sync('normalize-path'));
    var actual = lookup('package.json', {cwd: cwd});
    assert.dirname(actual, cwd);
    assert.basename(actual, 'package.json');

    actual = lookup('c/package.json', {cwd: 'test/fixtures/a/b/c/d/e/f/g'});
    assert.basename(actual, 'package.json');
    assert.dirname(actual, 'test/fixtures/a/b/c');

    cwd = path.dirname(resolve.sync('is-glob'));
    actual = lookup('package.json', {cwd: cwd});
    assert.dirname(actual, cwd);
    assert.basename(actual, 'package.json');
  });

  it('should support finding file in immediate parent dir', function () {
    cwd = path.resolve(__dirname, 'fixtures/a/b/c');
    var actual = lookup('a.md', { cwd: cwd });
    assert.dirname(actual, path.dirname(cwd));
    assert.basename(actual, 'a.md');
  });

  it('should support glob patterns', function () {
    var opts = {cwd: 'test/fixtures/a/b/c/d/e/f/g'};

    actual = lookup('**/c/package.json', opts);
    assert.dirname(actual, 'test/fixtures/a/b/c');
    assert.basename(actual, 'package.json');

    actual = lookup('c/package.json', opts);
    assert.dirname(actual, 'test/fixtures/a/b/c');
    assert.basename(actual, 'package.json');

    actual = lookup('**/ONE.txt', opts);
    assert.dirname(actual, 'test/fixtures/a/b/c');
    assert.basename(actual, 'ONE.txt');

    actual = lookup('**/two.txt', opts);
    assert.dirname(actual, 'test/fixtures/a/b/c');
    assert.basename(actual, 'two.txt');

    cwd = npm('is-glob');
    actual = lookup('p*.json', {cwd: cwd});
    assert.dirname(actual, cwd);
    assert.basename(actual, 'package.json');
  });

  it('should support arrays of glob patterns', function () {
    var opts = {cwd: 'test/fixtures/a/b/c/d/e/f/g'};

    actual = lookup(['lslsl', '**/c/package.json'], opts);
    assert.dirname(actual, 'test/fixtures/a/b/c');
    assert.basename(actual, 'package.json');

    actual = lookup(['lslsl', 'c/package.json'], opts);
    assert.dirname(actual, 'test/fixtures/a/b/c');
    assert.basename(actual, 'package.json');

    actual = lookup(['lslsl', '**/ONE.txt'], opts);
    assert.dirname(actual, 'test/fixtures/a/b/c');
    assert.basename(actual, 'ONE.txt');

    actual = lookup(['lslsl', '**/two.txt'], opts);
    assert.dirname(actual, 'test/fixtures/a/b/c');
    assert.basename(actual, 'two.txt');

    actual = lookup(['lslsl', '**/blah.txt'], opts);
    assert(actual === null);

    cwd = npm('is-glob');
    actual = lookup(['lslsl', 'p*.json'], {cwd: cwd});
    assert.dirname(actual, cwd);
    assert.basename(actual, 'package.json');
  });

  it('should support micromatch `matchBase` option:', function () {
    var opts = { matchBase: true, cwd: 'test/fixtures/a/b/c/d/e/f/g' };

    actual = lookup('package.json', opts);
    assert.basename(actual, 'package.json');
    assert.dirname(actual, 'test/fixtures/a/b/c/d/e/f/g');

    actual = lookup('one.txt', opts);
    assert.basename(actual, 'one.txt');
    assert.dirname(actual, 'test/fixtures/a/b/c/d');

    actual = lookup('two.txt', opts);
    assert.basename(actual, 'two.txt');
    assert.dirname(actual, 'test/fixtures/a/b/c');
  });

  it('should support micromatch `nocase` option:', function () {
    actual = lookup('ONE.*', { cwd: 'test/fixtures/a/b/c/d' });
    assert.basename(actual, 'ONE.txt');
    assert.dirname(actual, 'test/fixtures/a/b/c');

    actual = lookup('ONE.*', { cwd: 'test/fixtures/a/b/c/d', nocase: true });
    assert.basename(actual, 'one.txt');
    assert.dirname(actual, 'test/fixtures/a/b/c/d');
  });

  it('should find files from absolute paths:', function () {
    var actual = lookup('package.json', { cwd: __dirname })

    assert.basename(actual, 'package.json');
    assert.dirname(actual, path.resolve(__dirname, '..'));

    actual = lookup('one.txt', { cwd: __dirname + '/fixtures/a' });
    assert.basename(actual, 'one.txt');
    assert.dirname(actual, 'test/fixtures/a');

    actual = lookup('two.txt', { cwd: __dirname + '/fixtures/a/b/c' });
    assert.basename(actual, 'two.txt');
    assert.dirname(actual, 'test/fixtures/a/b/c');
  });

  it('should find files in user home:', function () {
    var actual = lookup('*', { cwd: home });
    assert.isPath(actual);
    assert.exists(actual);
    assert.dirname(actual, home);
  });

  it('should find files in user home using tilde expansion:', function () {
    var actual = lookup('*', { cwd: '~' });
    assert.isPath(actual);
    assert.exists(actual);
    assert.dirname(actual, home);
  });

  it('should return `null` when no files are found:', function () {
    assert.equal(lookup('foo.json', {cwd: 'test/fixtures/a/b/c/d/e/f/g'}), null);
    assert.equal(lookup('foo.json', {cwd: 'test/fixtures/a/b/c/d/e/f/g', matchBase: true}), null);
  });
});
