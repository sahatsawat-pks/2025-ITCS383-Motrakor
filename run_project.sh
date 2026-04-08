#!/bin/bash
# ==============================================================================
# SteamJek - Universal Quick Start Script
# Runs configuring the database (with password fixes), backend, frontend, and mobile
# ==============================================================================

echo "====================================================="
echo "🚀 Initiating SteamJek Implementations Flow 🚀"
echo "====================================================="

# 1. Setup Backend
echo ">> Setting up Backend..."
cd Implementations/steamjek-backend
npm install

# 2. Fix Passwords & Seed Database
echo ">> Seeding Database and Fixing Passwords to bcrypt hashes..."
node db_seed.js

# 3. Start Backend Background Process
echo ">> Starting Backend Server (Listening on :3000)..."
npm run dev > backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend running with PID: $BACKEND_PID"

# 4. Setup Frontend
echo ">> Setting up Frontend..."
cd ../steamjek-frontend
npm install

# 5. Start Frontend Background Process
echo ">> Starting Frontend Server (Listening on usually :8080)..."
npm start > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend running with PID: $FRONTEND_PID"

# 6. Setup and Run Mobile
echo ">> Setting up Mobile (Flutter)..."
cd ../steamjek-mobile
flutter pub get

echo ">> Launching Flutter Mobile App..."
echo "(Ensure an emulator is running or a device is connected)"
flutter run

# Cleanup on tear down
echo "Mobile app closed. Shutting down servers..."
kill $BACKEND_PID $FRONTEND_PID
echo "Done!"
