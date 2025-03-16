# build script for project (subject to change)
# REMEMBER TO EXECUTE THIS IN THE ROOT DIRECTORY OF THE PROJECT OR ELSE IT WON'T WORK!!!

if (Test-Path -Path dist) {
    Remove-Item dist -Recurse -Force
}
New-Item -Path dist -ItemType Directory

Copy-Item -Path index.html -Destination dist\index.html
Copy-Item -Path title.png -Destination dist\title.png

New-Item dist\src -ItemType Directory
New-Item dist\styles -ItemType Directory
New-Item dist\assets -ItemType Directory

Copy-Item -Path src\* -Destination dist\src -Recurse

Copy-Item -Path styles\* -Destination dist\styles -Recurse

Copy-Item -Path assets\* -Destination dist\assets -Recurse

# build the tailwind css output file
npx tailwindcss build -i styles\styles.css -o dist\styles\output.css
