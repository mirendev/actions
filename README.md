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
miren auth ci <app> --github <owner>/<repo>
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

### Outputs

| Output | Description |
|--------|-------------|
| `duration` | Deploy wall-clock duration in seconds |

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
