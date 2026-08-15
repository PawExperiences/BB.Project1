## 0.1.0 -- e2e infra plan 0.1.0

# Changelog

## [0.1.0] - 2026-08-15

### Added
- Minimal, cloud-free Terraform root configuration (`main.tf`, `variables.tf`, `outputs.tf`, `README.md`) that generates a `random_pet` name and plans to write it to a local file via `local_file`, proving BuildBoard's plan-only Terraform pipeline end-to-end with no cloud provider or credentials.
- `variables.tf`: `prefix` (string, default `"demo"`) and `pet_length` (number, default `2`, validated to the inclusive range 1-5).
- `outputs.tf`: the generated pet name (`random_pet` id) and the path of the written local file.
- `modules/naming/` module that centralizes name-normalization (lowercase, `[a-z0-9-]` only, single `-`-joined, no leading/trailing/duplicate hyphens) behind a single `name` output, wired into the root as `module.naming.name`.
- `.terraform-docs.yml` and terraform-docs-generated **Inputs**/**Outputs** tables in `README.md` for the root module.

### Changed
- Root `main.tf` now sources its generated name from `module.naming.name` instead of inline string concatenation.
- `README.md` expanded with the exact `terraform plan` command to run and an explicit statement that BuildBoard's pipeline only ever runs `terraform plan`, never `terraform apply`.

### Fixed
- N/A — no fix-type tasks are bundled in this release.
