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

# copy all the html files 
Copy-Item src\asi.html dist\src\asi.html
Copy-Item src\beer.html dist\src\beer.html
Copy-Item src\calc.html dist\src\calc.html
Copy-Item src\captcha.html dist\src\captcha.html
Copy-Item src\civilization.html dist\src\civilization.html
Copy-Item src\excuses.html dist\src\excuses.html
Copy-Item src\fence.html dist\src\fence.html
Copy-Item src\info.html dist\src\info.html
Copy-Item src\rng.html dist\src\rng.html
Copy-Item src\users.html dist\src\users.html

Copy-Item -Path styles\* -Destination dist\styles -Recurse
Remove-Item -Path dist\styles\styles.css

Copy-Item -Path assets\* -Destination dist\assets -Recurse

# build the tailwind css output file
npx tailwindcss build -i styles\styles.css -o dist\styles\output.css

# compile the ts into js
npx tsc src\asi.ts --outFile dist\src\asi.js
npx tsc src\calc.ts --outFile dist\src\calc.js
npx tsc src\captcha.ts --outFile dist\src\captcha.js
npx tsc src\civilization.ts --outFile dist\src\civilization.js
npx tsc src\excuses.ts --outFile dist\src\excuses.js
npx tsc src\fence.ts --outFile dist\src\fence.js
npx tsc src\rng.ts --outFile dist\src\rng.js
npx tsc src\users.ts --outFile dist\src\users.js