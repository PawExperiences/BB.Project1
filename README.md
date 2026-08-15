# Plannable configuration with no cloud

A minimal, self-contained Terraform root configuration that proves the
project's Terraform (plan-only) pipeline works end-to-end without touching
any cloud provider or credentials. It only uses the `random` and `local`
providers.

## What it does

- Generates a random pet name via a `random_pet` resource, whose word count
  is controlled by the `pet_length` variable.
- Plans to write that pet name to a local file via a `local_file` resource,
  whose path is derived from the `prefix` variable.

No cloud provider, backend, or credentials are required or configured.

<!-- BEGIN_TF_DOCS -->
## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_pet_length"></a> [pet\_length](#input\_pet\_length) | Number of words in the generated random pet name. | `number` | `2` | no |
| <a name="input_prefix"></a> [prefix](#input\_prefix) | Prefix used to derive the path of the generated local file. | `string` | `"demo"` | no |

## Outputs

| Name | Description |
|------|-------------|
| <a name="output_file_path"></a> [file\_path](#output\_file\_path) | The path of the local file the configuration plans to write. |
| <a name="output_pet_name"></a> [pet\_name](#output\_pet\_name) | The generated random pet name. |
<!-- END_TF_DOCS -->

## Usage

No cloud credentials are required. From the repository root, run:

```sh
terraform init
terraform plan
```

`terraform plan` should report 2 resources to add, 0 to change, and 0 to
destroy. This configuration does not run `terraform apply`, so the local
file is never actually written.

## BuildBoard pipeline

BuildBoard's pipeline only ever runs `terraform plan` against this
configuration. It never runs `terraform apply`, so no resources described
here are ever actually created, changed, or destroyed by the pipeline.

## Documentation

The Inputs and Outputs tables above are generated with
[terraform-docs](https://terraform-docs.io) using the config in
[`.terraform-docs.yml`](.terraform-docs.yml). To regenerate them after
changing `variables.tf` or `outputs.tf`, run:

```sh
terraform-docs -c .terraform-docs.yml .
```
