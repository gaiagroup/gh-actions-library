# Setup Trivy

This GitHub Action downloads and installs [Trivy](https://github.com/aquasecurity/trivy) with SHA256 verification.

Release assets are fetched via unauthenticated `curl` downloads from the public GitHub release URL. Authenticated `gh` API access to `aquasecurity/trivy` is blocked on GitHub-hosted runners because the Aqua Security organization has an IP allow list enabled.

## Usage

```yaml
jobs:
  my-awesome-job:
    runs-on: ubuntu-latest
    steps:
      - uses: gaiagroup/gh-actions-library/setup-trivy@master
      - run: trivy --version
```

## Pinning a version

When bumping Trivy, update `version`, `asset`, and `sha256` together. The SHA256 can be taken from the release checksums file:

```bash
curl -fsSL -o /tmp/trivy_checksums.txt \
  "https://github.com/aquasecurity/trivy/releases/download/v0.71.2/trivy_0.71.2_checksums.txt"
grep 'Linux-64bit.tar.gz' /tmp/trivy_checksums.txt
```

```yaml
- uses: gaiagroup/gh-actions-library/setup-trivy@master
  with:
    version: v0.71.2
    asset: trivy_0.71.2_Linux-64bit.tar.gz
    sha256: 0510e71e2fd39bf863856d499c8dc19feb4e7336546394c502a8f5cc7ab27460
```

## Inputs

| Name | Required | Description | Default |
| --- | --- | --- | --- |
| `version` | no | Trivy release tag (with `v` prefix) | `v0.71.2` |
| `asset` | no | Release asset file name to download | `trivy_0.71.2_Linux-64bit.tar.gz` |
| `sha256` | no | Expected SHA256 checksum of the asset | see `action.yml` |

## Outputs

| Name | Description |
| --- | --- |
| `trivy-path` | Absolute path to the installed `trivy` binary |

The install directory is also appended to `GITHUB_PATH`, so `trivy` is available in subsequent steps.
