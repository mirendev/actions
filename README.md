# Miren GitHub Actions

GitHub Actions for deploying applications to [Miren](https://miren.md).

## `mirendev/actions/deploy`

Deploy an application using OIDC authentication. No long-lived secrets needed — the action uses GitHub's OIDC token to authenticate with your Miren cluster.

### Prerequisites

From an authenticated machine:

```bash
# Export cluster address (store as MIREN_CLUSTER repo secret)
miren cluster export-address

# Create OIDC binding for your repo
miren auth ci add --app <app> --github <owner>/<repo>
```

### Usage

```yaml
permissions:
  id-token: write
  contents: read

steps:
  - uses: actions/checkout@v4
  - uses: mirendev/actions/deploy@main
    with:
      cluster: ${{ secrets.MIREN_CLUSTER }}
      app: myapp
```

### Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `cluster` | yes | | Cluster address with TLS fingerprint (from `miren cluster export-address`) |
| `app` | yes | | Application name to deploy |
| `args` | no | `""` | Extra arguments passed to `miren deploy` (e.g. `-vv --explain`) |
| `version` | no | `latest` | Miren CLI version to install |
| `ephemeral` | no | `""` | Deploy as an ephemeral preview with this label. The CLI normalizes it to a DNS-safe form, so a branch name like `feat/login` becomes `feat-login`. |
| `ttl` | no | `24h` | Lifetime for the ephemeral version (e.g. `48h`). Only used when `ephemeral` is set. |

### Outputs

| Output | Description |
|--------|-------------|
| `duration` | Deploy wall-clock duration in seconds |
| `url` | First URL of the deployed app (the ephemeral preview URL when `ephemeral` is set) |

### Ephemeral previews

Use `ephemeral` to deploy a short-lived preview version on every push to a PR. The version is labelled, gets its own subdomain, and is garbage-collected after `ttl`.

```yaml
on:
  pull_request:

permissions:
  id-token: write
  contents: read
  pull-requests: write

jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - id: deploy
        uses: mirendev/actions/deploy@main
        with:
          cluster: ${{ secrets.MIREN_CLUSTER }}
          app: myapp
          ephemeral: pr-${{ github.event.number }}
          ttl: 48h
      - run: echo "Preview is at ${{ steps.deploy.outputs.url }}"
```

## `mirendev/actions/setup`

Install the Miren CLI. Used internally by the deploy action, but available standalone for workflows that need `miren` for other commands.

### Usage

```yaml
steps:
  - uses: mirendev/actions/setup@main
  - run: miren version
```

### Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `version` | no | `latest` | Release channel or version to install (e.g. `latest`, `v0.4.1`) |

### Outputs

| Output | Description |
|--------|-------------|
| `version` | The installed Miren CLI version |
