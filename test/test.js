"use strict";

var fs = require("node:fs");
var path = require("node:path");
var assert = require("node:assert");
var { after, before, describe, it } = require("node:test");

var home = require("homedir-polyfill");
var resolve = require("resolve");

var support = require("./support");
var { assertExtras } = require("./support");

var findup = require("../");

var exists = fs.existsSync;
var normalize = support.normalize;
var chdir = support.chdir;
var npm = support.npm;
var isLinux = process.platform === "linux";
var cwd, actual;

describe("findup-sync", function () {
  before(function () {
    fs.writeFileSync(home() + "/_aaa.txt", "");
    fs.writeFileSync(home() + "/_bbb.txt", "");
  });

  after(function () {
    fs.unlinkSync(home() + "/_aaa.txt");
    fs.unlinkSync(home() + "/_bbb.txt");
  });

  it("should throw when the first arg is not a string or array:", function (t, cb) {
    try {
      findup();
      cb(new Error("expected an error"));
    } catch (err) {
      assert.deepStrictEqual(
        err.message,
        "findup-sync expects a string or array as the first argument.",
      );
      cb();
    }
  });

  it("should work when no cwd is given", function () {
    var actual = findup("package.json");
    assert.ok(actual);
    assertExtras.toHaveDirname(actual, path.resolve(__dirname, ".."));
    assertExtras.toHaveBasename(actual, "package.json");
    assert.deepStrictEqual(normalize(findup("package.json")), "package.json");
  });

  it("should find files in a child directory", function () {
    var expected = path.resolve(__dirname, "fixtures/a/b/file.txt");
    var restore = chdir(path.resolve(__dirname, "fixtures/a/b/c/d/e/f/g/h"));

    var actual = findup("a/b/file.txt");
    assert.ok(actual);
    assert.ok(exists(actual));
    assert.deepStrictEqual(actual, expected);
    restore();
  });

  it("should find case sensitive files in a child directory", function () {
    var expected = path.resolve(
      __dirname,
      "fixtures/a/b/",
      isLinux ? "Mochafile.txt" : "mochafile.txt",
    );
    var restore = chdir(path.resolve(__dirname, "fixtures/a/b/c/d/e/f/g/h"));

    var actual = findup("a/b/mochafile.txt", { nocase: true });
    assert.ok(actual);
    assert.ok(exists(actual));
    assert.deepStrictEqual(actual, expected);
    restore();
  });

  it("should find files in a child directory relative to a cwd", function () {
    var expectedFile = path.resolve(__dirname, "fixtures/a/b/file.txt");
    var expectedA = path.resolve(__dirname, "fixtures/a/a.txt");
    var tempDir = chdir(path.resolve(__dirname, "fixtures"));

    var actualFile = findup("a/b/file.txt", { cwd: "a/b/c/d" });
    assert.ok(actualFile);
    assert.ok(exists(actualFile));
    assert.deepStrictEqual(actualFile, expectedFile);

    var actualA = findup("a.txt", { cwd: "a/b/c/d/e/f" });
    assert.ok(actualA);
    assert.ok(exists(actualA));
    assert.deepStrictEqual(actualA, expectedA);
    tempDir();
  });

  it("should find case sensitive files in a child directory relative to a cwd", function () {
    var expectedFile = path.resolve(
      __dirname,
      "fixtures/a/b",
      isLinux ? "Mochafile.txt" : "mochafile.txt",
    );
    var expectedA = path.resolve(__dirname, "fixtures/a/a.txt");
    var tempDir = chdir(path.resolve(__dirname, "fixtures"));

    var actualFile = findup("a/b/mochafile.txt", {
      cwd: "a/b/c/d",
      nocase: true,
    });
    assert.ok(actualFile);
    assert.ok(exists(actualFile));
    assert.deepStrictEqual(actualFile, expectedFile);

    var actualA = findup("a.txt", { cwd: "a/b/c/d/e/f" });
    assert.ok(actualA);
    assert.ok(exists(actualA));
    assert.deepStrictEqual(actualA, expectedA);
    tempDir();
  });

  it("should support normal (non-glob) file paths:", function () {
    var normPath = normalize(
      findup("package.json", {
        cwd: path.dirname(resolve.sync("normalize-path")),
      }),
    );
    assert.deepStrictEqual(
      normPath,
      "node_modules/normalize-path/package.json",
    );

    var isGlob = normalize(
      findup("package.json", { cwd: path.dirname(resolve.sync("is-glob")) }),
    );
    assert.deepStrictEqual(isGlob, "node_modules/is-glob/package.json");

    cwd = path.dirname(resolve.sync("normalize-path"));
    var actual = findup("package.json", { cwd: cwd });

    assertExtras.toHaveDirname(actual, cwd);
    assertExtras.toHaveBasename(actual, "package.json");

    actual = findup("c/package.json", { cwd: "test/fixtures/a/b/c/d/e/f/g" });
    assertExtras.toHaveBasename(actual, "package.json");
    assertExtras.toHaveDirname(actual, "test/fixtures/a/b/c");

    cwd = path.dirname(resolve.sync("is-glob"));
    actual = findup("package.json", { cwd: cwd });
    assertExtras.toHaveDirname(actual, cwd);
    assertExtras.toHaveBasename(actual, "package.json");
  });

  it("should support normal (non-glob) case sensitive file paths:", function () {
    actual = findup("c/mochafile.txt", {
      cwd: "test/fixtures/a/b/c/d/e/f/g",
      nocase: true,
    });

    assertExtras.toHaveBasename(
      actual,
      isLinux ? "Mochafile.txt" : "mochafile.txt",
    );
    assertExtras.toHaveDirname(actual, "test/fixtures/a/b/c");
  });

  it("should support glob patterns", function () {
    assert.deepStrictEqual(
      normalize(
        findup("**/c/package.json", { cwd: "test/fixtures/a/b/c/d/e/f/g" }),
      ),
      "test/fixtures/a/b/c/package.json",
    );
    assert.deepStrictEqual(
      normalize(findup("**/one.txt", { cwd: "test/fixtures/a/b/c/d/e/f/g" })),
      "test/fixtures/a/b/c/d/one.txt",
    );
    assert.deepStrictEqual(
      normalize(findup("**/two.txt", { cwd: "test/fixtures/a/b/c/d/e/f/g" })),
      "test/fixtures/a/b/c/two.txt",
    );

    var pkg = normalize(findup("p*.json", { cwd: npm("micromatch") }));
    assert.deepStrictEqual(pkg, "node_modules/micromatch/package.json");

    var opts = { cwd: "test/fixtures/a/b/c/d/e/f/g" };

    actual = findup("**/c/package.json", opts);
    assertExtras.toHaveDirname(actual, "test/fixtures/a/b/c");
    assertExtras.toHaveBasename(actual, "package.json");

    actual = findup("c/package.json", opts);
    assertExtras.toHaveDirname(actual, "test/fixtures/a/b/c");
    assertExtras.toHaveBasename(actual, "package.json");

    actual = findup("**/ONE.txt", opts);
    assertExtras.toHaveDirname(actual, "test/fixtures/a/b/c");
    assertExtras.toHaveBasename(actual, "ONE.txt");

    actual = findup("**/two.txt", opts);
    assertExtras.toHaveDirname(actual, "test/fixtures/a/b/c");
    assertExtras.toHaveBasename(actual, "two.txt");

    cwd = npm("is-glob");
    actual = findup("p*.json", { cwd: cwd });
    assertExtras.toHaveDirname(actual, cwd);
    assertExtras.toHaveBasename(actual, "package.json");
  });

  it("should support case sensitive glob patterns", function () {
    assert.deepStrictEqual(
      normalize(
        findup("**/c/mochafile.txt", {
          cwd: "test/fixtures/a/b/c/d/e/f/g",
          nocase: true,
        }),
      ),
      "test/fixtures/a/b/c/Mochafile.txt",
    );
    assert.deepStrictEqual(
      normalize(
        findup("**/one.txt", {
          cwd: "test/fixtures/a/b/c/d/e/f/g",
          nocase: true,
        }),
      ),
      "test/fixtures/a/b/c/d/one.txt",
    );
    assert.deepStrictEqual(
      normalize(
        findup("**/two.txt", {
          cwd: "test/fixtures/a/b/c/d/e/f/g",
          nocase: true,
        }),
      ),
      "test/fixtures/a/b/c/two.txt",
    );

    assert.deepStrictEqual(
      normalize(findup("mocha*", { cwd: "test/fixtures/a/b/c", nocase: true })),
      "test/fixtures/a/b/c/Mochafile.txt",
    );

    var opts = { cwd: "test/fixtures/a/b/c/d/e/f/g", nocase: true };

    actual = findup("**/c/mochafile.txt", opts);
    assertExtras.toHaveDirname(actual, "test/fixtures/a/b/c");
    assertExtras.toHaveBasename(actual, "Mochafile.txt");

    actual = findup("c/mochafile.txt", opts);
    assertExtras.toHaveDirname(actual, "test/fixtures/a/b/c");
    assertExtras.toHaveBasename(
      actual,
      isLinux ? "Mochafile.txt" : "mochafile.txt",
    );

    opts.nocase = false;
    actual = findup("**/ONE.txt", opts);
    assertExtras.toHaveDirname(actual, "test/fixtures/a/b/c");
    assertExtras.toHaveBasename(actual, "ONE.txt");

    actual = findup("**/two.txt", opts);
    assertExtras.toHaveDirname(actual, "test/fixtures/a/b/c");
    assertExtras.toHaveBasename(actual, "two.txt");
  });

  it("should support arrays of glob patterns", function () {
    assert.deepStrictEqual(
      normalize(
        findup(["**/c/package.json"], { cwd: "test/fixtures/a/b/c/d/e/f/g" }),
      ),
      "test/fixtures/a/b/c/package.json",
    );
    assert.deepStrictEqual(
      normalize(findup(["**/one.txt"], { cwd: "test/fixtures/a/b/c/d/e/f/g" })),
      "test/fixtures/a/b/c/d/one.txt",
    );
    assert.deepStrictEqual(
      normalize(findup(["**/two.txt"], { cwd: "test/fixtures/a/b/c/d/e/f/g" })),
      "test/fixtures/a/b/c/two.txt",
    );

    var opts = { cwd: "test/fixtures/a/b/c/d/e/f/g" };

    actual = findup(["lslsl", "**/c/package.json"], opts);
    assertExtras.toHaveDirname(actual, "test/fixtures/a/b/c");
    assertExtras.toHaveBasename(actual, "package.json");

    actual = findup(["lslsl", "c/package.json"], opts);
    assertExtras.toHaveDirname(actual, "test/fixtures/a/b/c");
    assertExtras.toHaveBasename(actual, "package.json");

    actual = findup(["lslsl", "**/ONE.txt"], opts);
    assertExtras.toHaveDirname(actual, "test/fixtures/a/b/c");
    assertExtras.toHaveBasename(actual, "ONE.txt");

    actual = findup(["lslsl", "**/two.txt"], opts);
    assertExtras.toHaveDirname(actual, "test/fixtures/a/b/c");
    assertExtras.toHaveBasename(actual, "two.txt");

    actual = findup(["lslsl", "**/blah.txt"], opts);
    assert.ok(actual === null);

    cwd = npm("is-glob");
    actual = findup(["lslsl", "p*.json"], { cwd: cwd });
    assertExtras.toHaveDirname(actual, cwd);
    assertExtras.toHaveBasename(actual, "package.json");
  });

  it("should support micromatch `matchBase` option:", function () {
    var opts = { matchBase: true, cwd: "test/fixtures/a/b/c/d/e/f/g" };
    assert.deepStrictEqual(
      normalize(findup("package.json", opts)),
      "test/fixtures/a/b/c/d/e/f/g/package.json",
    );
    assert.deepStrictEqual(
      normalize(findup("one.txt", opts)),
      "test/fixtures/a/b/c/d/one.txt",
    );
    assert.deepStrictEqual(
      normalize(findup("two.txt", opts)),
      "test/fixtures/a/b/c/two.txt",
    );

    actual = findup("package.json", opts);
    assertExtras.toHaveBasename(actual, "package.json");
    assertExtras.toHaveDirname(actual, "test/fixtures/a/b/c/d/e/f/g");

    actual = findup("one.txt", opts);
    assertExtras.toHaveBasename(actual, "one.txt");
    assertExtras.toHaveDirname(actual, "test/fixtures/a/b/c/d");

    actual = findup("two.txt", opts);
    assertExtras.toHaveBasename(actual, "two.txt");
    assertExtras.toHaveDirname(actual, "test/fixtures/a/b/c");
  });

  it("should return `null` when no files are found:", function () {
    var dep = normalize(
      findup("*.foo", { cwd: path.dirname(resolve.sync("micromatch")) }),
    );
    assert.deepStrictEqual(dep, null);
    assert.deepStrictEqual(findup("**/b*.json", { cwd: npm("is-glob") }), null);
    assert.deepStrictEqual(
      findup("foo.json", { cwd: "test/fixtures/a/b/c/d/e/f/g" }),
      null,
    );
    assert.deepStrictEqual(
      findup("foo.json", {
        cwd: "test/fixtures/a/b/c/d/e/f/g",
        matchBase: true,
      }),
      null,
    );
  });

  it("should support finding file in immediate parent dir", function () {
    cwd = path.resolve(__dirname, "fixtures/a/b/c");
    var actual = findup("a.md", { cwd: cwd });
    assertExtras.toHaveDirname(actual, path.dirname(cwd));
    assertExtras.toHaveBasename(actual, "a.md");
  });

  it("should support micromatch `nocase` option:", function () {
    actual = findup("ONE.*", { cwd: "test/fixtures/a/b/c/d" });
    assertExtras.toHaveBasename(actual, "ONE.txt");
    assertExtras.toHaveDirname(actual, "test/fixtures/a/b/c");

    actual = findup("ONE.*", { cwd: "test/fixtures/a/b/c/d", nocase: true });
    assertExtras.toHaveBasename(actual, "one.txt");
    assertExtras.toHaveDirname(actual, "test/fixtures/a/b/c/d");
  });

  it("should find files from absolute paths:", function () {
    var actual = findup("package.json", { cwd: __dirname });

    assertExtras.toHaveBasename(actual, "package.json");
    assertExtras.toHaveDirname(actual, path.resolve(__dirname, ".."));

    actual = findup("one.txt", { cwd: __dirname + "/fixtures/a" });
    assertExtras.toHaveBasename(actual, "one.txt");
    assertExtras.toHaveDirname(actual, "test/fixtures/a");

    actual = findup("two.txt", { cwd: __dirname + "/fixtures/a/b/c" });
    assertExtras.toHaveBasename(actual, "two.txt");
    assertExtras.toHaveDirname(actual, "test/fixtures/a/b/c");
  });

  it("should find files in user home:", function () {
    var actual = findup("*", { cwd: home() });
    assertExtras.isPath(actual);
    assert.ok(exists(actual));
    assertExtras.toHaveDirname(actual, home());
  });

  it("should find files in user home using tilde expansion:", function () {
    var actual = findup("*", { cwd: "~" });
    assertExtras.isPath(actual);
    assert.ok(exists(actual));
    assertExtras.toHaveDirname(actual, home());
  });

  it("should match files in cwd before searching up", function () {
    var actual = findup(["a.txt", "a.md"], {
      cwd: __dirname + "/fixtures/a/b",
    });
    assertExtras.toHaveBasename(actual, "a.md");
    assertExtras.toHaveDirname(actual, "test/fixtures/a/b");
  });
});
