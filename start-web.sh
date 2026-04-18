#!/bin/bash
export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh" 2>/dev/null
nvm use 22 2>/dev/null
cd "$(dirname "$0")"
npx expo start --web --port "${PORT:-8085}"
