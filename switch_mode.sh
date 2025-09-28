#!/bin/bash
# Quick switch between mock and real Pi

echo "Select mode:"
echo "1. Mock simulation (localhost)"
echo "2. Real Raspberry Pi"
read -p "Enter choice (1 or 2): " choice

if [ $choice == "1" ]; then
    echo "MODE=mock" > .env.local
    echo "RASPBERRY_PI_IP=localhost" >> .env.local
    echo "✅ Switched to MOCK mode"
    echo "Run: npm run dev"
elif [ $choice == "2" ]; then
    read -p "Enter Pi IP address: " pi_ip
    echo "MODE=production" > .env.local
    echo "RASPBERRY_PI_IP=$pi_ip" >> .env.local
    echo "✅ Switched to REAL Pi mode ($pi_ip)"
    echo "Make sure Pi services are running!"
else
    echo "Invalid choice"
fi