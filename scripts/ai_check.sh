#!/bin/bash
# ai_check.sh - Diagnostic tool for AI Jail and Environment

echo "Starting AI Environment Check..."
echo "--------------------------------"

# Check for Bubblewrap
if command -v bwrap >/dev/null 2>&1; then
    echo "[PASS] Bubblewrap is installed."
else
    echo "[FAIL] Bubblewrap is NOT installed."
fi

# Check for ai-jail
if command -v ai-jail >/dev/null 2>&1; then
    echo "[PASS] ai-jail is installed."
else
    echo "[FAIL] ai-jail is NOT installed."
fi

# Check Python and common tools
python3 --version | xargs echo "[INFO] Python3: "
pip3 --version | xargs echo "[INFO] Pip3: "
sqlite3 --version | xargs echo "[INFO] SQLite3: "

# Check for CLAUDE.md
if [ -f "CLAUDE.md" ]; then
    echo "[PASS] CLAUDE.md found."
else
    echo "[FAIL] CLAUDE.md NOT found."
fi

# Check for project structure
[ -d "tests" ] || echo "[WARN] tests/ directory missing."
[ -d "sql" ] || echo "[WARN] sql/ directory missing."

echo "--------------------------------"
echo "Check Done."
