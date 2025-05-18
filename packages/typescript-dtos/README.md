[![main](https://github.com/basketry/typescript-dtos/workflows/build/badge.svg?branch=main&event=push)](https://github.com/basketry/typescript-dtos/actions?query=workflow%3Abuild+branch%3Amain+event%3Apush)
[![main](https://img.shields.io/npm/v/@basketry/typescript-dtos)](https://www.npmjs.com/package/@basketry/typescript-dtos)

# Typescript DTOs

[Basketry generator](https://github.com/basketry/basketry) for generating Data Transfer Objects (DTOs) and associated mapper functions. This generator can be coupled with any Basketry parser.

## Quick Start

// TODO

---

## For contributors:

Note that the `lint` script is run prior to `build`. Auto-fixable linting or formatting errors may be fixed by running `npm run fix`.

### Create and run tests

1.  Add tests by creating files with the `.test.ts` suffix
1.  Run the tests: `npm t`
1.  Test coverage can be viewed at `/coverage/lcov-report/index.html`

### Publish a new package version

1. Ensure latest code is published on the `main` branch.
1. Create the new version number with `npm version {major|minor|patch}`
1. Push the branch and the version tag: `git push origin main --follow-tags`

The [publish workflow](https://github.com/basketry/typescript-dtos/actions/workflows/publish.yml) will build and pack the new version then push the package to NPM. Note that publishing requires write access to the `main` branch.
