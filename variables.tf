variable "prefix" {
  type        = string
  description = "Prefix used to derive the path of the generated local file."
  default     = "demo"
}

variable "pet_length" {
  type        = number
  description = "Number of words in the generated random pet name."
  default     = 2

  validation {
    condition     = var.pet_length >= 1 && var.pet_length <= 5
    error_message = "pet_length must be between 1 and 5, inclusive."
  }
}
