# Coolify deployment webhook hotfix

GitHub Actions run 76 confirmed all validation steps passed, but Coolify deployment returned HTTP 405 because the current Coolify deploy endpoint requires POST rather than GET.

The CI/CD workflow now calls authenticated Coolify deploy webhooks with POST. No secret values are stored in this repository.
