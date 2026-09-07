#!/usr/bin/env bash
# Builds the VITE_APP_USERS value for the GitHub-secret sign-in.
#
#   ./scripts/make-user-hashes.sh millie:somepassword jane:anotherpassword
#
# Prints one line to paste into the repository secret. Passwords are stored as
# SHA-256 hashes so the built JavaScript does not contain them in the clear.
#
# Be clear-eyed about what this protects: a static site has to ship whatever it
# checks against, so a determined person can read past it. It keeps the tool out
# of casual view. Only a real backend (see SETUP.md) makes it a lock.

set -euo pipefail

if [[ $# -eq 0 ]]; then
  echo "Usage: $0 username:password [username:password ...]" >&2
  exit 1
fi

out=()
for pair in "$@"; do
  user="${pair%%:*}"
  pass="${pair#*:}"
  if [[ "$user" == "$pair" || -z "$pass" ]]; then
    echo "Expected username:password, got '$pair'" >&2
    exit 1
  fi
  if [[ ${#pass} -lt 8 ]]; then
    echo "Password for '$user' is under 8 characters." >&2
    exit 1
  fi
  hash=$(printf '%s' "$pass" | shasum -a 256 | cut -d' ' -f1)
  out+=("$(printf '%s' "$user" | tr '[:upper:]' '[:lower:]'):${hash}")
done

echo "Set this as the repository secret VITE_APP_USERS:"
echo
( IFS=,; echo "${out[*]}" )
