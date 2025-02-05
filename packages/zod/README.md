[![main](https://github.com/basketry/zod/workflows/build/badge.svg?branch=main&event=push)](https://github.com/basketry/zod/actions?query=workflow%3Abuild+branch%3Amain+event%3Apush)
[![main](https://img.shields.io/npm/v/@basketry/zod)](https://www.npmjs.com/package/@basketry/zod)

# zod

[Basketry generator](https://github.com/basketry/basketry) for generating [Zod](https://zod.dev) schemas. This parser can be coupled with any Basketry parser.

## Quick Start

1. Install this package
2. Add the `@basketry/zod` generator to your Basketry config

Read the official docs at [Basketry.io](https://basketry.io/docs/components/@basketry/zod)

---

## For contributors:

### Run this project

1.  Install packages: `npm ci`
1.  Build the code: `npm run build`
1.  Run it! `npm start`

Note that the `lint` script is run prior to `build`. Auto-fixable linting or formatting errors may be fixed by running `npm run fix`.

### Create and run tests

1.  Add tests by creating files with the `.test.ts` suffix
1.  Run the tests: `npm t`
1.  Test coverage can be viewed at `/coverage/lcov-report/index.html`

### Publish a new package version

1. Create new version
   1. Navigate to the [version workflow](https://github.com/basketry/zod/actions/workflows/version.yml) from the Actions tab.
   1. Manually dispatch the action with the appropriate inputs
   1. This will create a PR with the new version
1. Publish to NPM
   1. Review and merge the PR
   1. The [publish workflow](https://github.com/basketry/zod/actions/workflows/publish.yml) will create a git tag and publish the package on NPM

---

Generated with [generator-ts-console](https://www.npmjs.com/package/generator-ts-console)
