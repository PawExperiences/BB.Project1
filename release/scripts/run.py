#!/usr/bin/env python3
import os
import subprocess
import sys

BINARY_NAME = "wordcount"
binary_path = os.path.join(".", BINARY_NAME + (".exe" if os.name == "nt" else ""))

if not os.path.isfile(binary_path):
    print("-- Binary not found, building %s" % BINARY_NAME)
    subprocess.run(["go", "build", "-o", binary_path, "."], check=True)
else:
    print("-- Using existing %s binary" % binary_path)

print("-- Running %s %s" % (binary_path, " ".join(sys.argv[1:])))
result = subprocess.run([binary_path] + sys.argv[1:])
sys.exit(result.returncode)
