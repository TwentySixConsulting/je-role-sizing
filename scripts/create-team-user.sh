#!/usr/bin/env bash
# Creates (or resets the password of) the single shared team account that the
# Role Sizing password box signs in.
#
# Usage:
#   SUPABASE_URL=https://xxxx.supabase.co \
#   SUPABASE_SERVICE_ROLE_KEY=... \
#   TEAM_EMAIL=rolesizing@twentysixconsulting.co.uk \
#   ./scripts/create-team-user.sh 'the-password-you-want'
#
# The service role key bypasses row level security, so keep it out of the app,
# out of Vercel's client-side variables, and out of git.

set -euo pipefail

PASSWORD="${1:-}"
TEAM_EMAIL="${TEAM_EMAIL:-rolesizing@twentysixconsulting.co.uk}"

if [[ -z "$PASSWORD" ]]; then
  echo "Give the password as the first argument." >&2
  exit 1
fi
if [[ ${#PASSWORD} -lt 10 ]]; then
  echo "Use at least 10 characters - this is the only thing protecting client job descriptions." >&2
  exit 1
fi
: "${SUPABASE_URL:?Set SUPABASE_URL}"
: "${SUPABASE_SERVICE_ROLE_KEY:?Set SUPABASE_SERVICE_ROLE_KEY}"

api="${SUPABASE_URL%/}/auth/v1/admin/users"
auth=(-H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}")

# Already there? Then this is a password reset rather than a create.
existing=$(curl -sS "${auth[@]}" "${api}?page=1&per_page=1000" \
  | python3 -c "
import json,sys
email = '${TEAM_EMAIL}'.lower()
users = json.load(sys.stdin).get('users', [])
print(next((u['id'] for u in users if (u.get('email') or '').lower() == email), ''))
")

if [[ -n "$existing" ]]; then
  echo "Team account already exists; resetting its password."
  curl -sS -X PUT "${auth[@]}" -H 'Content-Type: application/json' \
    -d "$(python3 -c "import json,os;print(json.dumps({'password':os.environ['P']}))" P="$PASSWORD")" \
    "${api}/${existing}" > /dev/null
  echo "Password updated for ${TEAM_EMAIL}."
else
  curl -sS -X POST "${auth[@]}" -H 'Content-Type: application/json' \
    -d "$(python3 -c "
import json,os
print(json.dumps({
  'email': os.environ['E'],
  'password': os.environ['P'],
  'email_confirm': True,
}))" E="$TEAM_EMAIL" P="$PASSWORD")" \
    "$api" | python3 -c "
import json,sys
r = json.load(sys.stdin)
if r.get('id'): print('Created team account', r['email'])
else: sys.exit('Failed: ' + json.dumps(r))
"
fi

echo
echo "Consultants now sign in with just this password. Share it however you share"
echo "the Zigbert dashboard passwords."
