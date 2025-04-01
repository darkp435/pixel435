#!/bin/bash

# Build script for project (subject to change)
# REMEMBER TO EXECUTE THIS IN THE ROOT DIRECTORY OF THE PROJECT OR ELSE IT WON'T WORK!!!

# Remove the dist directory if it exists
if [ -d "dist" ]; then
    rm -rf dist
fi

# Create the dist directory and subdirectories
mkdir -p dist/src dist/styles dist/assets

# Copy HTML files
cp index.html dist/index.html
cp title.png dist/title.png

# Copy all HTML files from src
cp src/asi.html dist/src/asi.html
cp src/beer.html dist/src/beer.html
cp src/calc.html dist/src/calc.html
cp src/captcha.html dist/src/captcha.html
cp src/civilization.html dist/src/civilization.html
cp src/excuses.html dist/src/excuses.html
cp src/fence.html dist/src/fence.html
cp src/info.html dist/src/info.html
cp src/rng.html dist/src/rng.html
cp src/users.html dist/src/users.html

# Copy styles, but remove the existing styles.css in dist/styles
cp -r styles/* dist/styles
rm -f dist/styles/styles.css

# Copy assets
cp -r assets/* dist/assets

# Build the tailwind CSS output file
npx tailwindcss build -i styles/styles.css -o dist/styles/output.css

# Compile the TS files into JS
npx tsc -p tsconfig.json