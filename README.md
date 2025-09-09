# Basketry - TypeScript Monorepo

This repository is the monorepo for Basketry components implemented in TypeScript. It uses NPM workspaces to manage multiple packages that share tooling, CI, and release automation.

## Packages

| Package                                       | Version                                                                                                          | Description                                                                                                                         |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| [`@basketry/express`](packages/express)       | [![main](https://img.shields.io/npm/v/@basketry/express)](https://www.npmjs.com/package/@basketry/express)       | [Basketry](https://basketry.io) generator for [ExpressJS](https://expressjs.com//) routers and handlers.                            |
| [`@basketry/typescript`](packages/typescript) | [![main](https://img.shields.io/npm/v/@basketry/typescript)](https://www.npmjs.com/package/@basketry/typescript) | [Basketry](https://basketry.io) generator for [TypeScript](https://www.typescriptlang.org/) interfaces, types, and enums, and more. |
| [`@basketry/zod`](packages/zod)               | [![main](https://img.shields.io/npm/v/@basketry/zod)](https://www.npmjs.com/package/@basketry/zod)               | [Basketry](https://basketry.io) generator for [Zod](https://zod.dev/) validation schemas.                                           |

## Versioning & publishing

This repo uses two GitHub Actions workflows:

### 1) Version PR (prepare a release)

Open a version PR for a workspace:

- Run the [Version workflow](https://github.com/basketry/typescript/actions/workflows/version.yml) manually in Actions.
- Inputs:
  - `workspace`: the npm workspace name (e.g., `@basketry/typescript`)
  - `newversion`: semver bump or exact version (e.g., `minor`, `1.2.3`, `prerelease`, etc.)
  - `preid` (optional): prerelease tag (e.g., `beta`, `rc`)

This workflow **only opens a PR** with the version change for that package that describes the specific version that will be published along with any changes to [dist tags](https://docs.npmjs.com/adding-dist-tags-to-packages). Review and merge as usual.

### 2) Publish on merge (automated)

When a workspace's package version changes, the [Publish workflow](https://github.com/basketry/typescript/actions/workflows/publish.yml) is automatically run which:

- Detects which workspaces changed their `version` in the merge.
- Skips any `name@version` already published on npm.
- Publishes each remaining workspace with `npm publish --provenance`.
- Applies a Git tag per release using the convention `<package>@<version>` (e.g., `@basketry/typescript@1.2.3`).
- Uses `latest` for stable releases; for prereleases, uses the prerelease identifier as the dist-tag (e.g., `beta`, `rc`).

Note that the Publish workflow will trigger a publish anytime a workspace's package version changes, even if that change was not initiated from a Version PR. If multiple packages publish from the same merge, each gets its own tag pointing at the merge commit.
