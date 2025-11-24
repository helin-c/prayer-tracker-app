#!/bin/bash

echo "🔧 Setting up GitHub repository..."
echo "=================================="

# Check if git is initialized
if [ ! -d .git ]; then
    echo "❌ Git not initialized. Run the main setup script first."
    exit 1
fi

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Prayer Tracker App setup

- React Native (Expo) frontend with TypeScript
- Python FastAPI backend with virtual environment
- Project structure and configuration files
- Basic API endpoints
- Testing setup"

echo "\n✅ Initial commit created!"
echo "\n📝 Next steps:"
echo "1. Create a new repository on GitHub"
echo "2. Run these commands (replace YOUR_USERNAME and YOUR_REPO):"
echo ""
echo "   git remote add origin https://github.com/CinkoFurkan/prayer-tracker-app.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. Your friend can then clone with:"
echo "   git clone https://github.com/CinkoFurkan/prayer-tracker-app.git"
