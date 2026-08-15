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

## Variables

| Name         | Type   | Default | Description                                                                 |
|--------------|--------|---------|-------------------------------------------------------------------------------|
| `prefix`     | string | `"demo"`| Prefix used to derive the path of the generated local file.                 |
| `pet_length` | number | `2`     | Number of words in the generated random pet name. Must be between 1 and 5.  |

## Outputs

| Name        | Description                                          |
|-------------|-------------------------------------------------------|
| `pet_name`  | The generated random pet name.                        |
| `file_path` | The path of the local file the configuration plans to write. |

## Usage

No cloud credentials are required. From this directory, run:

```sh
terraform init
terraform plan
```

`terraform plan` should report 2 resources to add, 0 to change, and 0 to
destroy. This configuration does not run `terraform apply`, so the local
file is never actually written.
