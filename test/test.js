'use strict';

require('mocha');
var argv = require('minimist')(process.argv.slice(2));
var fs = require('fs');
var path = require('path');
var assert = require('assert');
var expand = require('resolve-dir');
var norm = require('normalize-path');
var home = require('user-home');
var isAbsolute = require('is-absolute');
var resolve = require('resolve');
var cwd, actual, opts;

var findup = require('../');

function normalize(fp) {
  return fp ? norm(path.relative('.', fp)) : null;
}

if (argv.bench) {
  var b = path.join(__dirname, 'benchmark/code', argv.bench);
  console.log(b);
  findup = require(b);
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

describe('findup-sync', function () {
  before(function () {
    fs.writeFileSync(home + '/_aaa.txt', '');
    fs.writeFileSync(home + '/_bbb.txt', '');
  });
  after(function () {
    fs.unlinkSync(home + '/_aaa.txt');
    fs.unlinkSync(home + '/_bbb.txt');
  });

  it('should throw when the first arg is not a string or array:', function(cb) {
    try {
      findup();
      cb(new Error('expected an error'));
    } catch (err) {
      assert.equal(err.message, 'findup-sync expects a string or array as the first argument.');
      cb();
    }
  });

  it('should work when no cwd is given', function () {
    var actual = findup('package.json');
    assert(actual);
    assert.dirname(actual, path.resolve(__dirname, '..'));
    assert.basename(actual, 'package.json');
    assert.equal(normalize(findup('package.json')), 'package.json');
  });

  it('should support normal (non-glob) file paths:', function () {
    var normPath = normalize(findup('package.json', {cwd: path.dirname(resolve.sync('normalize-path'))}));
    assert.equal(normPath, 'node_modules/normalize-path/package.json');

    var isGlob = normalize(findup('package.json', {cwd: path.dirname(resolve.sync('is-glob'))}));
    assert.equal(isGlob, 'node_modules/is-glob/package.json');

    cwd = path.dirname(resolve.sync('normalize-path'));
    var actual = findup('package.json', {cwd: cwd});
    assert.dirname(actual, cwd);
    assert.basename(actual, 'package.json');

    actual = findup('c/package.json', {cwd: 'test/fixtures/a/b/c/d/e/f/g'});
    assert.basename(actual, 'package.json');
    assert.dirname(actual, 'test/fixtures/a/b/c');

    cwd = path.dirname(resolve.sync('is-glob'));
    actual = findup('package.json', {cwd: cwd});
    assert.dirname(actual, cwd);
    assert.basename(actual, 'package.json');
  });

  it('should support glob patterns', function() {
    assert.equal(normalize(findup('**/c/package.json', {cwd: 'test/fixtures/a/b/c/d/e/f/g'})), 'test/fixtures/a/b/c/package.json');
    assert.equal(normalize(findup('**/one.txt', {cwd: 'test/fixtures/a/b/c/d/e/f/g'})), 'test/fixtures/a/b/c/d/one.txt');
    assert.equal(normalize(findup('**/two.txt', {cwd: 'test/fixtures/a/b/c/d/e/f/g'})), 'test/fixtures/a/b/c/two.txt');

    var pkg = normalize(findup('p*.json', {cwd: npm('micromatch')}));
    assert.equal(pkg, 'node_modules/micromatch/package.json');

    var opts = {cwd: 'test/fixtures/a/b/c/d/e/f/g'};

    actual = findup('**/c/package.json', opts);
    assert.dirname(actual, 'test/fixtures/a/b/c');
    assert.basename(actual, 'package.json');

    actual = findup('c/package.json', opts);
    assert.dirname(actual, 'test/fixtures/a/b/c');
    assert.basename(actual, 'package.json');

    actual = findup('**/ONE.txt', opts);
    assert.dirname(actual, 'test/fixtures/a/b/c');
    assert.basename(actual, 'ONE.txt');

    actual = findup('**/two.txt', opts);
    assert.dirname(actual, 'test/fixtures/a/b/c');
    assert.basename(actual, 'two.txt');

    cwd = npm('is-glob');
    actual = findup('p*.json', {cwd: cwd});
    assert.dirname(actual, cwd);
    assert.basename(actual, 'package.json');
  });

  it('should support arrays of glob patterns', function() {
    assert.equal(normalize(findup(['**/c/package.json'], {cwd: 'test/fixtures/a/b/c/d/e/f/g'})), 'test/fixtures/a/b/c/package.json');
    assert.equal(normalize(findup(['**/one.txt'], {cwd: 'test/fixtures/a/b/c/d/e/f/g'})), 'test/fixtures/a/b/c/d/one.txt');
    assert.equal(normalize(findup(['**/two.txt'], {cwd: 'test/fixtures/a/b/c/d/e/f/g'})), 'test/fixtures/a/b/c/two.txt');

    var opts = {cwd: 'test/fixtures/a/b/c/d/e/f/g'};

    actual = findup(['lslsl', '**/c/package.json'], opts);
    assert.dirname(actual, 'test/fixtures/a/b/c');
    assert.basename(actual, 'package.json');

    actual = findup(['lslsl', 'c/package.json'], opts);
    assert.dirname(actual, 'test/fixtures/a/b/c');
    assert.basename(actual, 'package.json');

    actual = findup(['lslsl', '**/ONE.txt'], opts);
    assert.dirname(actual, 'test/fixtures/a/b/c');
    assert.basename(actual, 'ONE.txt');

    actual = findup(['lslsl', '**/two.txt'], opts);
    assert.dirname(actual, 'test/fixtures/a/b/c');
    assert.basename(actual, 'two.txt');

    actual = findup(['lslsl', '**/blah.txt'], opts);
    assert(actual === null);

    cwd = npm('is-glob');
    actual = findup(['lslsl', 'p*.json'], {cwd: cwd});
    assert.dirname(actual, cwd);
    assert.basename(actual, 'package.json');
  });

  it('should support micromatch `matchBase` option:', function() {
    var opts = { matchBase: true, cwd: 'test/fixtures/a/b/c/d/e/f/g' };
    assert.equal(normalize(findup('package.json', opts)), 'test/fixtures/a/b/c/d/e/f/g/package.json');
    assert.equal(normalize(findup('one.txt', opts)), 'test/fixtures/a/b/c/d/one.txt');
    assert.equal(normalize(findup('two.txt', opts)), 'test/fixtures/a/b/c/two.txt');

    actual = findup('package.json', opts);
    assert.basename(actual, 'package.json');
    assert.dirname(actual, 'test/fixtures/a/b/c/d/e/f/g');

    actual = findup('one.txt', opts);
    assert.basename(actual, 'one.txt');
    assert.dirname(actual, 'test/fixtures/a/b/c/d');

    actual = findup('two.txt', opts);
    assert.basename(actual, 'two.txt');
    assert.dirname(actual, 'test/fixtures/a/b/c');
  });

  it('should return `null` when no files are found:', function() {
    var dep = normalize(findup('*.foo', {cwd: path.dirname(resolve.sync('micromatch'))}));
    assert.equal(dep, null);
    assert.equal(findup('**/b*.json', {cwd: npm('is-glob')}), null);
    assert.equal(findup('foo.json', {cwd: 'test/fixtures/a/b/c/d/e/f/g'}), null);
    assert.equal(findup('foo.json', {cwd: 'test/fixtures/a/b/c/d/e/f/g', matchBase: true}), null);
  });

  it('should support finding file in immediate parent dir', function () {
    cwd = path.resolve(__dirname, 'fixtures/a/b/c');
    var actual = findup('a.md', { cwd: cwd });
    assert.dirname(actual, path.dirname(cwd));
    assert.basename(actual, 'a.md');
  });

  it('should support micromatch `nocase` option:', function () {
    actual = findup('ONE.*', { cwd: 'test/fixtures/a/b/c/d' });
    assert.basename(actual, 'ONE.txt');
    assert.dirname(actual, 'test/fixtures/a/b/c');

    actual = findup('ONE.*', { cwd: 'test/fixtures/a/b/c/d', nocase: true });
    assert.basename(actual, 'one.txt');
    assert.dirname(actual, 'test/fixtures/a/b/c/d');
  });

  it('should find files from absolute paths:', function () {
    var actual = findup('package.json', { cwd: __dirname })

    assert.basename(actual, 'package.json');
    assert.dirname(actual, path.resolve(__dirname, '..'));

    actual = findup('one.txt', { cwd: __dirname + '/fixtures/a' });
    assert.basename(actual, 'one.txt');
    assert.dirname(actual, 'test/fixtures/a');

    actual = findup('two.txt', { cwd: __dirname + '/fixtures/a/b/c' });
    assert.basename(actual, 'two.txt');
    assert.dirname(actual, 'test/fixtures/a/b/c');
  });

  it('should find files in user home:', function () {
    var actual = findup('*', { cwd: home });
    assert.isPath(actual);
    assert.exists(actual);
    assert.dirname(actual, home);
  });

  it('should find files in user home using tilde expansion:', function () {
    var actual = findup('*', { cwd: '~' });
    assert.isPath(actual);
    assert.exists(actual);
    assert.dirname(actual, home);
  });
});
