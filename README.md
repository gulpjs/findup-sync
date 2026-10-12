<p align="center">
  <a href="https://gulpjs.com">
    <img height="257" width="114" src="https://raw.githubusercontent.com/gulpjs/artwork/master/gulp-2x.png">
  </a>
</p>

# findup-sync

[![NPM version][npm-image]][npm-url] [![Downloads][downloads-image]][npm-url] [![Build Status][ci-image]][ci-url] [![Coveralls Status][coveralls-image]][coveralls-url]

Find the first file matching a given pattern in the current directory or the nearest ancestor directory.

Matching is done with [micromatch][micromatch], please report any matching related issues on that repository.

## Usage

```js
var findup = require('findup-sync');
findup(patternOrPatterns [, micromatchOptions]);

// Start looking in the CWD.
var filepath1 = findup('{a,b}*.txt');

// Start looking somewhere else, and ignore case (probably a good idea).
var filepath2 = findup('{a,b}*.txt', {cwd: '/some/path', nocase: true});
```

## API

### `findup(patterns, [options])`

- `patterns` **{String|Array}**: Glob pattern(s) or file path(s) to match against.
- `options` **{Object}**: Options to pass to [micromatch]. Note that if you want to start in a different directory than the current working directory, specify a `cwd` property here.
- `returns` **{String}**: Returns the first matching file.

## Strict No LLM / No AI Policy

No LLMs for issues.

No LLMs for patches / pull requests.

No LLMs for comments on the bug tracker, including translation.

English is encouraged, but not required. You are welcome to post in your native language and rely on others to have their own translation tools of choice to interpret your words.

## License

MIT

<!-- prettier-ignore-start -->
[downloads-image]: https://img.shields.io/npm/dm/findup-sync.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/findup-sync
[npm-image]: https://img.shields.io/npm/v/findup-sync.svg?style=flat-square

[ci-url]: https://github.com/gulpjs/findup-sync/actions/workflows/dev.yml
[ci-image]: https://img.shields.io/github/actions/workflow/status/gulpjs/findup-sync/dev.yml?style=flat-square

[coveralls-url]: https://coveralls.io/r/gulpjs/findup-sync
[coveralls-image]: https://img.shields.io/coveralls/gulpjs/findup-sync/main.svg?style=flat-square
<!-- prettier-ignore-end -->

<!-- prettier-ignore-start -->
[micromatch]: http://github.com/micromatch/micromatch
<!-- prettier-ignore-end -->

