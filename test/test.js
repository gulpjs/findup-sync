'use strict';

require('mocha');
require('should');
var path = require('path');
var assert = require('assert');
var norm = require('normalize-path');
var resolve = require('resolve');
var findup = require('../');

function normalize(fp) {
  return fp ? norm(path.relative('.', fp)) : null;
}
function npm(name) {
  return path.dirname(resolve.sync(name));
}

describe('findup', function() {
  it('should throw when the first arg is not a string or array:', function() {
    (function() {
      findup();
    }).should.throw('findup-sync expects a string or array as the first argument.');
  });

  it('should work when no cwd is given', function() {
    normalize(findup('package.json')).should.equal('package.json');
  });

  it('should support normal (non-glob) file paths:', function() {
    var normPath = normalize(findup('package.json', {cwd: path.dirname(resolve.sync('normalize-path'))}));
    normPath.should.equal('node_modules/normalize-path/package.json');

    var isGlob = normalize(findup('package.json', {cwd: path.dirname(resolve.sync('is-glob'))}));
    isGlob.should.equal('node_modules/is-glob/package.json');
  });

  it('should support glob patterns', function() {
    normalize(findup('**/c/package.json', {cwd: 'test/fixtures/a/b/c/d/e/f/g'})).should.equal('test/fixtures/a/b/c/package.json');
    normalize(findup('**/one.txt', {cwd: 'test/fixtures/a/b/c/d/e/f/g'})).should.equal('test/fixtures/a/b/c/d/one.txt');
    normalize(findup('**/two.txt', {cwd: 'test/fixtures/a/b/c/d/e/f/g'})).should.equal('test/fixtures/a/b/c/two.txt');

    var pkg = normalize(findup('p*.json', {cwd: npm('micromatch')}));
    pkg.should.equal('node_modules/micromatch/package.json');
  });

  it('should support arrays of glob patterns', function() {
    normalize(findup(['**/c/package.json'], {cwd: 'test/fixtures/a/b/c/d/e/f/g'})).should.equal('test/fixtures/a/b/c/package.json');
    normalize(findup(['**/one.txt'], {cwd: 'test/fixtures/a/b/c/d/e/f/g'})).should.equal('test/fixtures/a/b/c/d/one.txt');
    normalize(findup(['**/two.txt'], {cwd: 'test/fixtures/a/b/c/d/e/f/g'})).should.equal('test/fixtures/a/b/c/two.txt');
  });

  it('should support micromatch `matchBase` option:', function() {
    var opts = { matchBase: true, cwd: 'test/fixtures/a/b/c/d/e/f/g' };
    normalize(findup('package.json', opts)).should.equal('test/fixtures/a/b/c/d/e/f/g/package.json');
    normalize(findup('one.txt', opts)).should.equal('test/fixtures/a/b/c/d/one.txt');
    normalize(findup('two.txt', opts)).should.equal('test/fixtures/a/b/c/two.txt');
  });

  it('should return `null` when no files are found:', function() {
    var dep = normalize(findup('*.foo', {cwd: path.dirname(resolve.sync('micromatch'))}));
    assert.equal(dep, null);
    assert.equal(findup('**/b*.json', {cwd: npm('is-glob')}), null);
    assert.equal(findup('foo.json', {cwd: 'test/fixtures/a/b/c/d/e/f/g'}), null);
    assert.equal(findup('foo.json', {cwd: 'test/fixtures/a/b/c/d/e/f/g', matchBase: true}), null);
  });
});
