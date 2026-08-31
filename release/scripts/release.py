import os

# Tag the release
os.system("git tag -a v0.1.0 -m 'Release e2e provider openai 0.1.0'")
# Push the tag
os.system("git push origin v0.1.0")
# Further release Publishing logic here...