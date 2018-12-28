'use strict';

var fs = require('fs');
var path = require('path');

var expect = require('expect');
var home = require('homedir-polyfill');
var resolve = require('resolve');

var support = require('./support');
expect.extend(support.expectExtras);

var findup = require('../');

var exists = fs.existsSync;
var normalize = support.normalize;
var chdir = support.chdir;
var npm = support.npm;
var isLinux = process.platform === 'linux';
var cwd, actual;

describe('findup-sync', function() {

  before(function(done) {
    fs.writeFileSync(home() + '/_aaa.txt', '');
    fs.writeFileSync(home() + '/_bbb.txt', '');
    done();
  });

  after(function(done) {
    fs.unlinkSync(home() + '/_aaa.txt');
    fs.unlinkSync(home() + '/_bbb.txt');
    done();
  });

  it('should throw when the first arg is not a string or array:', function(cb) {
    try {
      findup();
      cb(new Error('expected an error'));
    } catch (err) {
      expect(err.message).toEqual('findup-sync expects a string or array as the first argument.');
      cb();
    }
  });

  it('should work when no cwd is given', function(done) {
    var actual = findup('package.json');
    expect(actual).toExist();
    expect(actual).toHaveDirname(path.resolve(__dirname, '..'));
    expect(actual).toHaveBasename('package.json');
    expect(normalize(findup('package.json'))).toEqual('package.json');
    done();
  });

  it('should find files in a child directory', function(done) {
    var expected = path.resolve(__dirname, 'fixtures/a/b/file.txt');
    var restore = chdir(path.resolve(__dirname, 'fixtures/a/b/c/d/e/f/g/h'));

    var actual = findup('a/b/file.txt');
    expect(actual).toExist();
    expect(exists(actual)).toExist();
    expect(actual).toEqual(expected);
    restore();
    done();
  });

  it('should find case sensitive files in a child directory', function(done) {
    var expected = path.resolve(__dirname, 'fixtures/a/b/', (isLinux ? 'Mochafile.txt' : 'mochafile.txt'));
    var restore = chdir(path.resolve(__dirname, 'fixtures/a/b/c/d/e/f/g/h'));

    var actual = findup('a/b/mochafile.txt', { nocase: true });
    expect(actual).toExist();
    expect(exists(actual)).toExist();
    expect(actual).toEqual(expected);
    restore();
    done();
  });

  it('should find files in a child directory relative to a cwd', function(done) {
    var expectedFile = path.resolve(__dirname, 'fixtures/a/b/file.txt');
    var expectedA = path.resolve(__dirname, 'fixtures/a/a.txt');
    var tempDir = chdir(path.resolve(__dirname, 'fixtures'));

    var actualFile = findup('a/b/file.txt', { cwd: 'a/b/c/d' });
    expect(actualFile).toExist();
    expect(exists(actualFile)).toExist();
    expect(actualFile).toEqual(expectedFile);

    var actualA = findup('a.txt', { cwd: 'a/b/c/d/e/f' });
    expect(actualA).toExist();
    expect(exists(actualA)).toExist();
    expect(actualA).toEqual(expectedA);
    tempDir();
    done();
  });

  it('should find case sensitive files in a child directory relative to a cwd', function(done) {
    var expectedFile = path.resolve(__dirname, 'fixtures/a/b', (isLinux ? 'Mochafile.txt' : 'mochafile.txt'));
    var expectedA = path.resolve(__dirname, 'fixtures/a/a.txt');
    var tempDir = chdir(path.resolve(__dirname, 'fixtures'));

    var actualFile = findup('a/b/mochafile.txt', { cwd: 'a/b/c/d', nocase: true });
    expect(actualFile).toExist();
    expect(exists(actualFile)).toExist();
    expect(actualFile).toEqual(expectedFile);

    var actualA = findup('a.txt', { cwd: 'a/b/c/d/e/f' });
    expect(actualA).toExist();
    expect(exists(actualA)).toExist();
    expect(actualA).toEqual(expectedA);
    tempDir();
    done();
  });

  it('should support normal (non-glob) file paths:', function(done) {
    var normPath = normalize(findup('package.json', { cwd: path.dirname(resolve.sync('normalize-path')) }));
    expect(normPath).toEqual('node_modules/normalize-path/package.json');

    var isGlob = normalize(findup('package.json', { cwd: path.dirname(resolve.sync('is-glob')) }));
    expect(isGlob).toEqual('node_modules/is-glob/package.json');

    cwd = path.dirname(resolve.sync('normalize-path'));
    var actual = findup('package.json', { cwd: cwd });
    expect(actual).toHaveDirname(cwd);
    expect(actual).toHaveBasename('package.json');

    actual = findup('c/package.json', { cwd: 'test/fixtures/a/b/c/d/e/f/g' });
    expect(actual).toHaveBasename('package.json');
    expect(actual).toHaveDirname('test/fixtures/a/b/c');

    cwd = path.dirname(resolve.sync('is-glob'));
    actual = findup('package.json', { cwd: cwd });
    expect(actual).toHaveDirname(cwd);
    expect(actual).toHaveBasename('package.json');
    done();
  });

  it('should support normal (non-glob) case sensitive file paths:', function(done) {
    actual = findup('c/mochafile.txt', { cwd: 'test/fixtures/a/b/c/d/e/f/g', nocase: true });
    expect(actual).toHaveBasename(isLinux ? 'Mochafile.txt' : 'mochafile.txt');
    expect(actual).toHaveDirname('test/fixtures/a/b/c');
    done();
  });

  it('should support glob patterns', function(done) {
    expect(normalize(findup('**/c/package.json', { cwd: 'test/fixtures/a/b/c/d/e/f/g' }))).toEqual('test/fixtures/a/b/c/package.json');
    expect(normalize(findup('**/one.txt', { cwd: 'test/fixtures/a/b/c/d/e/f/g' }))).toEqual('test/fixtures/a/b/c/d/one.txt');
    expect(normalize(findup('**/two.txt', { cwd: 'test/fixtures/a/b/c/d/e/f/g' }))).toEqual('test/fixtures/a/b/c/two.txt');

    var pkg = normalize(findup('p*.json', { cwd: npm('micromatch') }));
    expect(pkg).toEqual('node_modules/micromatch/package.json');

    var opts = { cwd: 'test/fixtures/a/b/c/d/e/f/g' };

    actual = findup('**/c/package.json', opts);
    expect(actual).toHaveDirname('test/fixtures/a/b/c');
    expect(actual).toHaveBasename('package.json');

    actual = findup('c/package.json', opts);
    expect(actual).toHaveDirname('test/fixtures/a/b/c');
    expect(actual).toHaveBasename('package.json');

    actual = findup('**/ONE.txt', opts);
    expect(actual).toHaveDirname('test/fixtures/a/b/c');
    expect(actual).toHaveBasename('ONE.txt');

    actual = findup('**/two.txt', opts);
    expect(actual).toHaveDirname('test/fixtures/a/b/c');
    expect(actual).toHaveBasename('two.txt');

    cwd = npm('is-glob');
    actual = findup('p*.json', { cwd: cwd });
    expect(actual).toHaveDirname(cwd);
    expect(actual).toHaveBasename('package.json');
    done();
  });

  it('should support case sensitive glob patterns', function(done) {
    expect(normalize(findup('**/c/mochafile.txt', { cwd: 'test/fixtures/a/b/c/d/e/f/g', nocase: true }))).toEqual('test/fixtures/a/b/c/Mochafile.txt');
    expect(normalize(findup('**/one.txt', { cwd: 'test/fixtures/a/b/c/d/e/f/g', nocase: true }))).toEqual('test/fixtures/a/b/c/d/one.txt');
    expect(normalize(findup('**/two.txt', { cwd: 'test/fixtures/a/b/c/d/e/f/g', nocase: true }))).toEqual('test/fixtures/a/b/c/two.txt');

    expect(normalize(findup('mocha*', { cwd: 'test/fixtures/a/b/c', nocase: true }))).toEqual('test/fixtures/a/b/c/Mochafile.txt');

    var opts = { cwd: 'test/fixtures/a/b/c/d/e/f/g', nocase: true };

    actual = findup('**/c/mochafile.txt', opts);
    expect(actual).toHaveDirname('test/fixtures/a/b/c');
    expect(actual).toHaveBasename('Mochafile.txt');

    actual = findup('c/mochafile.txt', opts);
    expect(actual).toHaveDirname('test/fixtures/a/b/c');
    expect(actual).toHaveBasename(isLinux ? 'Mochafile.txt' : 'mochafile.txt');

    opts.nocase = false;
    actual = findup('**/ONE.txt', opts);
    expect(actual).toHaveDirname('test/fixtures/a/b/c');
    expect(actual).toHaveBasename('ONE.txt');

    actual = findup('**/two.txt', opts);
    expect(actual).toHaveDirname('test/fixtures/a/b/c');
    expect(actual).toHaveBasename('two.txt');
    done();
  });

  it('should support arrays of glob patterns', function(done) {
    expect(normalize(findup(['**/c/package.json'], { cwd: 'test/fixtures/a/b/c/d/e/f/g' }))).toEqual('test/fixtures/a/b/c/package.json');
    expect(normalize(findup(['**/one.txt'], { cwd: 'test/fixtures/a/b/c/d/e/f/g' }))).toEqual('test/fixtures/a/b/c/d/one.txt');
    expect(normalize(findup(['**/two.txt'], { cwd: 'test/fixtures/a/b/c/d/e/f/g' }))).toEqual('test/fixtures/a/b/c/two.txt');

    var opts = { cwd: 'test/fixtures/a/b/c/d/e/f/g' };

    actual = findup(['lslsl', '**/c/package.json'], opts);
    expect(actual).toHaveDirname('test/fixtures/a/b/c');
    expect(actual).toHaveBasename('package.json');

    actual = findup(['lslsl', 'c/package.json'], opts);
    expect(actual).toHaveDirname('test/fixtures/a/b/c');
    expect(actual).toHaveBasename('package.json');

    actual = findup(['lslsl', '**/ONE.txt'], opts);
    expect(actual).toHaveDirname('test/fixtures/a/b/c');
    expect(actual).toHaveBasename('ONE.txt');

    actual = findup(['lslsl', '**/two.txt'], opts);
    expect(actual).toHaveDirname('test/fixtures/a/b/c');
    expect(actual).toHaveBasename('two.txt');

    actual = findup(['lslsl', '**/blah.txt'], opts);
    expect(actual === null).toExist();

    cwd = npm('is-glob');
    actual = findup(['lslsl', 'p*.json'], { cwd: cwd });
    expect(actual).toHaveDirname(cwd);
    expect(actual).toHaveBasename('package.json');
    done();
  });

  it('should support micromatch `matchBase` option:', function(done) {
    var opts = { matchBase: true, cwd: 'test/fixtures/a/b/c/d/e/f/g' };
    expect(normalize(findup('package.json', opts))).toEqual('test/fixtures/a/b/c/d/e/f/g/package.json');
    expect(normalize(findup('one.txt', opts))).toEqual('test/fixtures/a/b/c/d/one.txt');
    expect(normalize(findup('two.txt', opts))).toEqual('test/fixtures/a/b/c/two.txt');

    actual = findup('package.json', opts);
    expect(actual).toHaveBasename('package.json');
    expect(actual).toHaveDirname('test/fixtures/a/b/c/d/e/f/g');

    actual = findup('one.txt', opts);
    expect(actual).toHaveBasename('one.txt');
    expect(actual).toHaveDirname('test/fixtures/a/b/c/d');

    actual = findup('two.txt', opts);
    expect(actual).toHaveBasename('two.txt');
    expect(actual).toHaveDirname('test/fixtures/a/b/c');
    done();
  });

  it('should return `null` when no files are found:', function(done) {
    var dep = normalize(findup('*.foo', { cwd: path.dirname(resolve.sync('micromatch')) }));
    expect(dep).toEqual(null);
    expect(findup('**/b*.json', { cwd: npm('is-glob') })).toEqual(null);
    expect(findup('foo.json', { cwd: 'test/fixtures/a/b/c/d/e/f/g' })).toEqual(null);
    expect(findup('foo.json', { cwd: 'test/fixtures/a/b/c/d/e/f/g', matchBase: true })).toEqual(null);
    done();
  });

  it('should support finding file in immediate parent dir', function(done) {
    cwd = path.resolve(__dirname, 'fixtures/a/b/c');
    var actual = findup('a.md', { cwd: cwd });
    expect(actual).toHaveDirname(path.dirname(cwd));
    expect(actual).toHaveBasename('a.md');
    done();
  });

  it('should support micromatch `nocase` option:', function(done) {
    actual = findup('ONE.*', { cwd: 'test/fixtures/a/b/c/d' });
    expect(actual).toHaveBasename('ONE.txt');
    expect(actual).toHaveDirname('test/fixtures/a/b/c');

    actual = findup('ONE.*', { cwd: 'test/fixtures/a/b/c/d', nocase: true });
    expect(actual).toHaveBasename('one.txt');
    expect(actual).toHaveDirname('test/fixtures/a/b/c/d');
    done();
  });

  it('should find files from absolute paths:', function(done) {
    var actual = findup('package.json', { cwd: __dirname });

    expect(actual).toHaveBasename('package.json');
    expect(actual).toHaveDirname(path.resolve(__dirname, '..'));

    actual = findup('one.txt', { cwd: __dirname + '/fixtures/a' });
    expect(actual).toHaveBasename('one.txt');
    expect(actual).toHaveDirname('test/fixtures/a');

    actual = findup('two.txt', { cwd: __dirname + '/fixtures/a/b/c' });
    expect(actual).toHaveBasename('two.txt');
    expect(actual).toHaveDirname('test/fixtures/a/b/c');
    done();
  });

  it('should find files in user home:', function(done) {
    var actual = findup('*', { cwd: home() });
    expect(actual).isPath();
    expect(exists(actual)).toExist();
    expect(actual).toHaveDirname(home());
    done();
  });

  it('should find files in user home using tilde expansion:', function(done) {
    var actual = findup('*', { cwd: '~' });
    expect(actual).isPath();
    expect(exists(actual)).toExist();
    expect(actual).toHaveDirname(home());
    done();
  });

  it('should match files in cwd before searching up', function(done) {
    var actual = findup(['a.txt', 'a.md'], { cwd: __dirname + '/fixtures/a/b' });
    expect(actual).toHaveBasename('a.md');
    expect(actual).toHaveDirname('test/fixtures/a/b');
    done();
  });
});
