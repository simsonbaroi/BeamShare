#!/bin/bash
set -e

echo "🔨 Building BeamShare for GitHub Pages..."

# Build the application
npm run build

# Create docs directory for GitHub Pages
rm -rf docs
mkdir -p docs

# Copy built files to docs directory
cp -r dist/public/* docs/

# Create a CNAME file if you have a custom domain (optional)
# echo "your-domain.com" > docs/CNAME

echo "✅ Build complete! Files ready for GitHub Pages in ./docs"
echo ""
echo "Next steps:"
echo "1. Commit and push these changes"
echo "2. Go to GitHub repository Settings > Pages"
echo "3. Set source to 'Deploy from a branch'"
echo "4. Select 'main' branch and '/docs' folder"
echo "5. Your app will be available at: https://yourusername.github.io/your-repo-name"