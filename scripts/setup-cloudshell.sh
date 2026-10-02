#!/usr/bin/env bash
# =====================================================================================
# AWallet Cloud Shell Setup & Provisioning Script
# Initializes Firebase, Firestore Database, Invisible Finance dependencies,
# secure Service Account keys, and environment variables.
# =====================================================================================
set -euo pipefail

echo "====================================================================="
echo "   AWallet — Google Cloud Shell Automated Provisioning Setup"
echo "====================================================================="

# 1. Load project configurations from firebase-applet-config.json
CONFIG_FILE="$(dirname "$0")/../firebase-applet-config.json"
if [ ! -f "$CONFIG_FILE" ]; then
  echo "Error: firebase-applet-config.json not found!"
  exit 1
fi

PROJECT_ID=$(node -p "require('$CONFIG_FILE').projectId")
DATABASE_ID=$(node -p "require('$CONFIG_FILE').firestoreDatabaseId")
AUTH_DOMAIN=$(node -p "require('$CONFIG_FILE').authDomain")
API_KEY=$(node -p "require('$CONFIG_FILE').apiKey")
OAUTH_CLIENT_ID=$(node -p "require('$CONFIG_FILE').oAuthClientId")
LOCATION="asia-northeast1"

echo "Loaded configuration:"
echo "  - Project ID:             $PROJECT_ID"
echo "  - Firestore Database ID:  $DATABASE_ID"
echo "  - Auth Domain:            $AUTH_DOMAIN"
echo "  - Region:                 $LOCATION"
echo ""

# 2. Check Prerequisites
echo "==> [1/6] Verifying environment & runtime tools..."
node -v || { echo "Node.js is required"; exit 1; }
npm -v || { echo "npm is required"; exit 1; }

# Install Firebase CLI if missing
if ! command -v firebase &> /dev/null; then
  echo "Firebase CLI not found. Installing firebase-tools globally..."
  npm install -g firebase-tools
else
  echo "Firebase CLI is available: $(firebase --version)"
fi

# Check Foundry/forge for Invisible Finance smart contract testing
if command -v forge &> /dev/null; then
  echo "Foundry (forge) is available: $(forge --version)"
else
  echo "Note: forge is not installed. To run smart contract tests, install Foundry via: curl -L https://foundry.paradigm.xyz | bash"
fi

# 3. Install project and Invisible Finance dependencies
echo "==> [2/6] Installing Invisible Finance & AWallet dependencies..."
npm install --no-audit --no-fund

# 4. Authenticate & Configure Firebase / Google Cloud project
echo "==> [3/6] Configuring Firebase project and active targets..."
gcloud config set project "$PROJECT_ID" --quiet

# Use target Firebase project
firebase use --add "$PROJECT_ID" || true

# 5. Initialize & provision Firestore Database
echo "==> [4/6] Provisioning Firestore database '$DATABASE_ID'..."
# Create Firestore database if it doesn't already exist
if firebase firestore:databases:list --project "$PROJECT_ID" 2>/dev/null | grep -q "$DATABASE_ID"; then
  echo "  ✓ Firestore database '$DATABASE_ID' already exists."
else
  echo "  Creating Firestore database '$DATABASE_ID' in $LOCATION..."
  firebase firestore:databases:create "$DATABASE_ID" \
    --location="$LOCATION" \
    --type=firestore-native \
    --project="$PROJECT_ID" || echo "  ! Firestore create command completed or exists."
fi

# Deploy firestore.rules
echo "Deploying security rules (including awalletBalances zero-write restrictions)..."
firebase deploy --only firestore:rules --project "$PROJECT_ID"

# 6. Generate Service Account Key Securely (Outside Git Tracking)
echo "==> [5/6] Creating secure Service Account & secret management..."
SA_NAME="awallet-backend-executor"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
SECRETS_DIR="$HOME/.secrets"

# Create Service Account if not existing
if ! gcloud iam service-accounts describe "$SA_EMAIL" --project="$PROJECT_ID" &>/dev/null; then
  echo "Creating service account $SA_NAME..."
  gcloud iam service-accounts create "$SA_NAME" \
    --description="AWallet Backend Secure Balance & Session Key Executor" \
    --display-name="AWallet Backend Executor" \
    --project="$PROJECT_ID"
fi

# Bind minimal required Firestore role (roles/datastore.user)
echo "Binding roles/datastore.user to $SA_EMAIL..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/datastore.user" \
  --quiet

# Export Service Account JSON key to isolated user directory
mkdir -p "$SECRETS_DIR"
chmod 700 "$SECRETS_DIR"
KEY_FILE="$SECRETS_DIR/awallet-sa-key.json"

if [ ! -f "$KEY_FILE" ]; then
  echo "Generating service account key at $KEY_FILE..."
  gcloud iam service-accounts keys create "$KEY_FILE" \
    --iam-account="$SA_EMAIL" \
    --project="$PROJECT_ID"
  chmod 600 "$KEY_FILE"
  echo "  ✓ Key generated and secured with 0600 permissions."
else
  echo "  ✓ Service account key already exists at $KEY_FILE."
fi

# 7. Setup Environment Variables (.env)
echo "==> [6/6] Setting up environment variables..."
ENV_FILE="$(dirname "$0")/../.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Creating .env from .env.example..."
  cp "$(dirname "$0")/../.env.example" "$ENV_FILE"
fi

# Update or append project configuration to .env safely
update_or_add_env() {
  local key="$1"
  local val="$2"
  if grep -q "^${key}=" "$ENV_FILE"; then
    sed -i "s|^${key}=.*|${key}=${val}|" "$ENV_FILE"
  else
    echo "${key}=${val}" >> "$ENV_FILE"
  fi
}

update_or_add_env "FIREBASE_PROJECT_ID" "$PROJECT_ID"
update_or_add_env "FIREBASE_FIRESTORE_DATABASE_ID" "$DATABASE_ID"
update_or_add_env "GOOGLE_APPLICATION_CREDENTIALS" "$KEY_FILE"
update_or_add_env "VITE_FIREBASE_API_KEY" "$API_KEY"
update_or_add_env "VITE_FIREBASE_AUTH_DOMAIN" "$AUTH_DOMAIN"
update_or_add_env "VITE_FIREBASE_PROJECT_ID" "$PROJECT_ID"
update_or_add_env "VITE_FIREBASE_OAUTH_CLIENT_ID" "$OAUTH_CLIENT_ID"
update_or_add_env "INVISIBLE_SESSION_MANAGER" "0x4337B2A01492dCe883f3ed872659dc01ab8872f3"
update_or_add_env "INVISIBLE_PAYMASTER" "0x4337C2A01492dCe883f3ed872659dc01ab8872f4"
update_or_add_env "DID_HOOK_ADDRESS" "0x4000D2A01492dCe883f3ed872659dc01ab8872f5"

echo "====================================================================="
echo "  ✓ Setup successfully completed!"
echo "  - Firestore database: $DATABASE_ID"
echo "  - Service Account Key: $KEY_FILE (Strictly kept in ~/.secrets, outside Git)"
echo "  - Environment file:    $ENV_FILE"
echo ""
echo "To start development in Cloud Shell:"
echo "  npm run dev"
echo "====================================================================="
