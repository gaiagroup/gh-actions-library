# ORAS cache

Persist a directory between workflow runs as an OCI artifact in a container registry, using [ORAS](https://oras.land). Two composite actions, modelled after `actions/cache/restore` and `actions/cache/save`:

- `oras-cache/restore` pulls `<registry>:<key>` and extracts it into `path`
- `oras-cache/save` archives `path` and pushes it as `<registry>:<key>`

Use it instead of `actions/cache` when the 7-day eviction of the GitHub cache does not fit the job (monthly schedules, large toolchains, provider/plugin caches) or when the artifact must be shared across repositories. Retention is whatever lifecycle policy the registry repository has.

Originally extracted from the `broca` pipeline, where it ships JS build outputs between jobs through `broca/pipeline-cache` on ECR.

## Usage

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@v4

      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: eu-central-1

      - uses: gaiagroup/gh-actions-library/oras-cache/restore@master
        id: cache
        with:
          registry: 123456789012.dkr.ecr.eu-central-1.amazonaws.com/my-project/pipeline-cache
          key: my-workflow-tf-providers
          path: ${{ github.workspace }}/.tg-provider-cache

      - run: terragrunt run-all --provider-cache --provider-cache-dir ${{ github.workspace }}/.tg-provider-cache init

      - uses: gaiagroup/gh-actions-library/oras-cache/save@master
        if: always()
        continue-on-error: true
        with:
          registry: 123456789012.dkr.ecr.eu-central-1.amazonaws.com/my-project/pipeline-cache
          key: my-workflow-tf-providers
          path: ${{ github.workspace }}/.tg-provider-cache
          skip-if-fingerprint: ${{ steps.cache.outputs.fingerprint }}
```

`skip-if-fingerprint` makes `save` a no-op when nothing under `path` changed since `restore`, so a mutable key can be reused run after run without rewriting an identical artifact.

## Registry requirements

The caller must already hold credentials for the registry. With `ecr-login: true` (default) both actions run `aws ecr get-login-password | oras login`, deriving the region from the registry host; the AWS identity needs:

- `ecr:GetAuthorizationToken` on `*`
- restore: `ecr:BatchGetImage`, `ecr:GetDownloadUrlForLayer`, `ecr:BatchCheckLayerAvailability` on the repository
- save: additionally `ecr:InitiateLayerUpload`, `ecr:UploadLayerPart`, `ecr:CompleteLayerUpload`, `ecr:PutImage`

The repository should allow mutable tags, since a cache key is a tag that gets overwritten. Prefer a count-based lifecycle policy (`imageCountMoreThan`) over `sinceImagePushed` for caches that are refreshed less often than the retention window.

For non-ECR registries set `ecr-login: false` and run `oras login` yourself before the action.

## Inputs

### `restore`

| Name | Required | Description | Default |
| --- | --- | --- | --- |
| `registry` | yes | OCI repository URI without tag | |
| `key` | yes | Cache key (artifact tag) | |
| `path` | yes | Directory to extract into, created if missing | |
| `fail-on-cache-miss` | no | Fail when the key does not exist | `false` |
| `ecr-login` | no | Run `aws ecr get-login-password \| oras login` | `true` |
| `oras-version` | no | ORAS CLI version | `1.2.0` |

### `save`

| Name | Required | Description | Default |
| --- | --- | --- | --- |
| `registry` | yes | OCI repository URI without tag | |
| `key` | yes | Cache key (artifact tag), overwritten on each push | |
| `path` | yes | Directory to archive | |
| `skip-if-fingerprint` | no | Skip when the tree fingerprint equals this value | `''` |
| `compression` | no | `zstd`, `gzip` or `none` | `zstd` |
| `ecr-login` | no | Run `aws ecr get-login-password \| oras login` | `true` |
| `oras-version` | no | ORAS CLI version | `1.2.0` |

## Outputs

### `restore`

| Name | Description |
| --- | --- |
| `cache-hit` | `true` when the key was found and extracted |
| `fingerprint` | SHA256 over relative paths and sizes of files under `path` after restore |

### `save`

| Name | Description |
| --- | --- |
| `pushed` | `true` when an artifact was pushed, `false` when skipped |

## Notes

- The archive is a single layer named `<key>.tar.zst` (or `.tar.gz` / `.tar`), pushed with `--image-spec v1.0` for compatibility with registries that reject OCI 1.1 artifact manifests.
- `path` is archived with `tar -C path .`, so absolute paths never leak into the artifact and it can be restored anywhere.
- Both actions need `zstd` on the runner for the default compression; `ubuntu-latest` ships it.
