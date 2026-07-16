# Release process

Maintainers cut releases from a reviewed, green `main` branch.

1. Confirm formatting, typechecks, tests, migration lint, package dry-runs, Compose validation, container builds, secret scanning, and license checks.
2. Update the version and release notes without including secrets, internal paths, or private artifacts.
3. Create and push a signed `vX.Y.Z` tag.
4. Confirm GitHub Actions published commit-addressed and versioned app, API, publisher, and migration images. A release tag also updates `stable`.
5. Smoke-test a fresh Compose deployment and an upgrade from the previous release.
6. Publish the GitHub release with migration, backup, rollback, and known-limit notes.

The workflow uses only the repository `GITHUB_TOKEN` with `contents: read` and `packages: write`; pull requests build without publishing.
