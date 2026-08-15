output "pet_name" {
  description = "The generated random pet name."
  value       = random_pet.this.id
}

output "file_path" {
  description = "The path of the local file the configuration plans to write."
  value       = local_file.this.filename
}
