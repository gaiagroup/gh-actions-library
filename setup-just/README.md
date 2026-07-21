# Setup just

This GitHub Action downloads and installs the [just](https://github.com/casey/just) command runner with SHA256 verification.

Release assets are fetched with authenticated `gh release download` (using `github.token` by default) to avoid API rate limits.

## Usage

```yaml
jobs:
  my-awesome-job:
    runs-on: ubuntu-latest
    steps:
      - uses: gaiagroup/gh-actions-library/setup-just@master
      - run: just --version
```

## Pinning a version

When bumping just, update `just-version`, `asset`, and `sha256` together. Checksums are published in the release `SHA256SUMS` file:

```bash
gh release download 1.57.0 --repo casey/just --pattern SHA256SUMS --dir /tmp
grep 'x86_64-unknown-linux-musl' /tmp/SHA256SUMS
```

```yaml
- uses: gaiagroup/gh-actions-library/setup-just@master
  with:
    just-version: '1.57.0'
    asset: just-1.57.0-x86_64-unknown-linux-musl.tar.gz
    sha256: 45b548094283cb9739af8f13273b8cddeee869f5b4ef2bb631b1f311cb566155
```

For non-Linux platforms, pick the matching release asset (for example `just-1.57.0-x86_64-apple-darwin.tar.gz` or `just-1.57.0-x86_64-pc-windows-msvc.zip`) and its SHA256 from `SHA256SUMS`.

`just-version` must be an exact release tag (for example `1.57.0`). NPM-style ranges such as `0.10` or `^1.0.0` are no longer supported.

## Inputs

| Name | Required | Description | Default |
| --- | --- | --- | --- |
| `just-version` | no | just release tag (no `v` prefix) | `1.57.0` |
| `asset` | no | Release asset file name to download | `just-1.57.0-x86_64-unknown-linux-musl.tar.gz` |
| `sha256` | no | Expected SHA256 checksum of the asset | see `action.yaml` |
| `github-token` | no | Token for authenticated `gh` downloads | `${{ github.token }}` |

## Outputs

| Name | Description |
| --- | --- |
| `just-path` | Absolute path to the installed `just` binary |

The install directory is also appended to `GITHUB_PATH`, so `just` is available in subsequent steps.

## License

Licensed under either of

- Apache License, Version 2.0 ([LICENSE-APACHE](LICENSE-APACHE) or
   http://www.apache.org/licenses/LICENSE-2.0)
- MIT license ([LICENSE-MIT](LICENSE-MIT) or http://opensource.org/licenses/MIT)

at your option.
