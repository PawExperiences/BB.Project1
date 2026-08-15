terraform {
  required_version = ">= 1.5.0"

  required_providers {
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.5"
    }
  }
}

resource "random_pet" "this" {
  length = var.pet_length
}

resource "local_file" "this" {
  filename = "${var.prefix}-${random_pet.this.id}.txt"
  content  = random_pet.this.id
}
