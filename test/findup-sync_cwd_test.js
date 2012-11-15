'use strict';

// Nodejs lib.
var path = require('path');

var findup = require('../lib/findup-sync.js');

// Get a relative path.
var rel = function(abspath) {
  return typeof abspath === 'string' ? path.relative('.', abspath) : abspath;
};

exports['findup'] = {
  setUp: function(done) {
    // setup here
    this.originalWorkingDir = process.cwd();
    process.chdir('test/fixtures/a/b');
    done();
  },
  tearDown: function(done) {
    process.chdir(this.originalWorkingDir);
    done();
  },
  'cwd': function(test) {
    test.expect(8);
    test.equal(rel(findup('foo.txt')), '../foo.txt', 'should find files');
    test.equal(rel(findup('bar.txt')), 'bar.txt', 'should find files');
    test.equal(rel(findup('a.txt')), '../../a.txt', 'should find files');
    test.equal(rel(findup('?.txt')), '../../a.txt', 'should support glob patterns');
    test.equal(rel(findup('*.txt')), 'bar.txt', 'should find the first thing that matches the glob pattern');
    test.equal(rel(findup(['b*.txt', 'f*.txt'])), 'bar.txt', 'should find the first thing that matches any of the glob patterns');
    test.equal(rel(findup(['f*.txt', 'b*.txt'])), 'bar.txt', 'should find the first thing that matches any of the glob patterns');
    test.equal(findup('not-gonna-exist-i-hope.txt'), null, 'should returning null if no files found');
    test.done();
  },
};
