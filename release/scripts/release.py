import subprocess

# Tag the release
subprocess.run(['git', 'tag', '-a', 'v0.1.0', '-m', 'Release e2e provider openai 0.1.0'])

# Push the release
subprocess.run(['git', 'push', 'origin', 'v0.1.0'])

# Additional steps such as uploading artifacts would be here.