# Releasing

The following sections describe this repo's release methodology. Some of it is automated in Travis CI, some of it should be performed manually by this repo's maintainers.

## Prerelases

Every commit to the `develop` branch increments the prerelease version of the Surya package with the following command:

```npm version prerelease -m "chore: release version %s [skip ci]"```

which is a part of the `.travis/prerelease_pu.sh` script. The script bumps up the version and commits to GitHub without triggering a Travis build again.

No action is need from maintainers to trigger a prerelease publish.

## Releases

Travis CI is also configured to publish the package to NPM on every **tagged** commit to `master`.

What this means is that maintainers should bump the version themselves (should not be a prerelease, so should change _major_, _minor_ or _patch_) by any mean they wish after every PR from `develop` and therefore trigger a publish in Travis.

Suggested methods are to either run the following commands on a clean git directory (which can be checked with `git clean -n`):

```
npm version [major | minor | patch] -m "chore: release version %s"
```

or:

```
git add package.json package-lock.json
git tag -a vX.Y.Z -m "chore: release version vX.Y.Z"
git push upstream master
```