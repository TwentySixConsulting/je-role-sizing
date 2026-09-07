#!/usr/bin/env bash
# Switches the live site over to the shared Supabase library, in one go.
#
# Run this after the migration SQL has been run in the Supabase SQL editor.
# The three values come from the Supabase dashboard:
#   Project Settings -> API -> Project URL, anon/publishable key, service_role key
#
#   SUPABASE_URL=https://<ref>.supabase.co \
#   SUPABASE_ANON_KEY=<anon key> \
#   SUPABASE_SERVICE_ROLE_KEY=<service role key> \
#   ./scripts/finish-setup.sh millie:somepassword jane:anotherpassword
#
# It checks the tables exist, creates an account per consultant, points the
# deployed site at the database, and kicks off a deploy.

set -euo pipefail

REPO="${REPO:-TwentySixConsulting/je-role-sizing}"
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

: "${SUPABASE_URL:?Set SUPABASE_URL}"
: "${SUPABASE_ANON_KEY:?Set SUPABASE_ANON_KEY}"
: "${SUPABASE_SERVICE_ROLE_KEY:?Set SUPABASE_SERVICE_ROLE_KEY}"
if [[ $# -eq 0 ]]; then
  echo "Give at least one username:password." >&2
  exit 1
fi

url="${SUPABASE_URL%/}"

echo "1/4  Checking the tables exist..."
code=$(curl -sS -o /tmp/je_check.json -w '%{http_code}' \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  "${url}/rest/v1/je_roles?select=id&limit=1")
if [[ "$code" != "200" ]]; then
  echo >&2
  echo "     je_roles is not there yet (HTTP ${code})." >&2
  echo "     Run supabase/migrations/0001_je_role_sizing.sql in the SQL editor first." >&2
  cat /tmp/je_check.json >&2 2>/dev/null || true
  rm -f /tmp/je_check.json
  exit 1
fi
rm -f /tmp/je_check.json
echo "     found."

echo "2/4  Creating the consultant accounts..."
SUPABASE_URL="$url" SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
  "${here}/create-users.sh" "$@"

echo "3/4  Pointing the deployed site at the database..."
gh secret set VITE_SUPABASE_URL      --repo "$REPO" --body "$url"
gh secret set VITE_SUPABASE_ANON_KEY --repo "$REPO" --body "$SUPABASE_ANON_KEY"
# The build-time credential list is no longer used once real accounts exist,
# and leaving it behind would be misleading.
gh secret delete VITE_APP_USERS --repo "$REPO" 2>/dev/null && echo "     removed the old build-time password list" || true

echo "4/4  Deploying..."
gh workflow run deploy.yml --repo "$REPO"
echo
echo "Done. Watch it with:  gh run watch --repo $REPO"
echo "Then sign in at https://twentysixconsulting.github.io/je-role-sizing/"
echo "Roles are now shared, and the password is enforced by the database."
