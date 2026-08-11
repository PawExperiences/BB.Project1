#!/bin/sh
# release.sh - build, smoke-test, tag, and publish the prime_tester v0.6.0 release.
# Run from the repository root, on the exact commit being released, after CI is green.
set -eu

VERSION="${VERSION:-0.6.0}"
TAG="v${VERSION}"
BUILD_DIR="${BUILD_DIR:-build}"
REMOTE="${REMOTE:-origin}"
NOTES_FILE="${NOTES_FILE:-release/RELEASE_NOTES.md}"

echo "==> Configuring: cmake -B ${BUILD_DIR}"
cmake -B "${BUILD_DIR}"

echo "==> Building: cmake --build ${BUILD_DIR}"
cmake --build "${BUILD_DIR}"

echo "==> Running CTest suite (unit checks + informational sieve benchmark)"
(cd "${BUILD_DIR}" && ctest --output-on-failure)

ARTIFACT="${BUILD_DIR}/prime_tester"
if [ ! -x "${ARTIFACT}" ]; then
  echo "ERROR: expected artifact not found or not executable: ${ARTIFACT}" >&2
  exit 1
fi
echo "==> Artifact ready: ${ARTIFACT}"

echo "==> Smoke-testing artifact against the README Manual Verification scenarios"

expect_out() {
  _desc="$1"; _exp_exit="$2"; _exp_out="$3"; shift 3
  _act_out=$("${ARTIFACT}" "$@" 2>/tmp/prime_tester_smoke.stderr); _act_exit=$?
  if [ "${_act_exit}" != "${_exp_exit}" ] || [ "${_act_out}" != "${_exp_out}" ]; then
    echo "SMOKE TEST FAILED: ${_desc} (exit ${_act_exit}, stdout '${_act_out}')" >&2
    exit 1
  fi
  echo "  OK: ${_desc}"
}

expect_out "prime input (17)"      0 "17 is prime"      17
expect_out "composite input (18)"  0 "18 is not prime"  18
expect_out "zero input (0)"        0 "0 is not prime"   0
expect_out "one input (1)"         0 "1 is not prime"   1
expect_out "negative input (-7)"   0 "-7 is not prime"  -7

_out=$(printf '' | "${ARTIFACT}"); _ec=$?
if [ "${_ec}" != "0" ] || [ -n "${_out}" ]; then
  echo "SMOKE TEST FAILED: empty stdin should print nothing and exit 0" >&2
  exit 1
fi
echo "  OK: empty stdin -> no output, exit 0"

set +e
"${ARTIFACT}" abc >/tmp/prime_tester_smoke.stdout 2>/tmp/prime_tester_smoke.stderr
_ec=$?
set -e
_err=$(cat /tmp/prime_tester_smoke.stderr)
if [ "${_ec}" != "1" ] || [ "${_err}" != "not a number: abc" ]; then
  echo "SMOKE TEST FAILED: non-numeric token 'abc' should print 'not a number: abc' to stderr and exit 1" >&2
  exit 1
fi
echo "  OK: non-numeric token 'abc' -> stderr 'not a number: abc', exit 1"

_upto_out=$("${ARTIFACT}" --upto 30)
_expected_upto="2
3
5
7
11
13
17
19
23
29"
if [ "${_upto_out}" != "${_expected_upto}" ]; then
  echo "SMOKE TEST FAILED: --upto 30 did not print primes 2..29 in order" >&2
  exit 1
fi
echo "  OK: --upto 30 -> primes 2..29"

rm -f /tmp/prime_tester_smoke.stdout /tmp/prime_tester_smoke.stderr
echo "==> All smoke tests passed"

if git rev-parse "${TAG}" >/dev/null 2>&1; then
  echo "==> Tag ${TAG} already exists locally, skipping tag creation"
else
  echo "==> Creating annotated tag ${TAG}"
  git tag -a "${TAG}" -m "Release ${TAG}"
fi

echo "==> Pushing tag ${TAG} to ${REMOTE}"
git push "${REMOTE}" "${TAG}"

if command -v gh >/dev/null 2>&1; then
  if gh release view "${TAG}" >/dev/null 2>&1; then
    echo "==> GitHub release ${TAG} already exists, skipping creation"
  else
    echo "==> Creating GitHub release ${TAG} and uploading artifact"
    if [ -f "${NOTES_FILE}" ]; then
      gh release create "${TAG}" "${ARTIFACT}" --title "${TAG}" --notes-file "${NOTES_FILE}"
    else
      gh release create "${TAG}" "${ARTIFACT}" --title "${TAG}" --notes "Release ${TAG}"
    fi
  fi
else
  echo "NOTE: 'gh' CLI not found; skipping GitHub release creation/upload." >&2
  echo "      Publish manually and attach: ${ARTIFACT}" >&2
fi

echo "==> Done. Release ${TAG} built, smoke-tested, and published (or ready for manual publish)."
