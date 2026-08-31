import os
import subprocess

# Define the release version
release_version = '0.1.0'

# Tag the release
subprocess.run(['git', 'tag', '-a', f'v{release_version}', '-m', f'Release version {release_version}'])
# Push the tag
subprocess.run(['git', 'push', 'origin', f'v{release_version}'])
print(f'Release {release_version} tagged and pushed successfully.')
