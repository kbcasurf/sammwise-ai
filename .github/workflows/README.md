# Build and Push Docker Image GitHub Action

This GitHub Action (`action.yml`) builds the Docker image from `./docker/Dockerfile`, scans it for vulnerabilities, and pushes it to the GitHub Container Registry (GHCR).

## Trigger

- `push` to `main` (in practice, this only happens when a pull request is merged — direct pushes to `main` are blocked by branch protection).
- `workflow_dispatch`, for manual runs from the Actions tab.

## Workflow

1. Check out the repository.
2. Set up QEMU and Docker Buildx.
3. Log in to `ghcr.io` using `github.actor` and the built-in `GITHUB_TOKEN` (no external secrets required).
4. Build the image locally (`push: false`, `load: true`), tagged `sammwise:scan`.
5. Scan the image with Trivy (`severity: HIGH,CRITICAL`, `exit-code: 1`). The build fails here if new high/critical vulnerabilities are found; accepted, upstream-only-fixable findings are listed in `.trivyignore`.
6. If the scan passes, build and push the image to `ghcr.io/<repository_owner>/sammwise:latest`.

## Permissions

The workflow only needs:

```yaml
permissions:
  contents: read
  packages: write
```

No repository secrets need to be configured — authentication to GHCR uses the automatically provided `GITHUB_TOKEN`.
