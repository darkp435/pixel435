# Build Instructions
These are the build instructions for the project in case I ever forget (or if you are a contributor, hi by the way, for you to do).

## Step 1: Generating the black hole
Run the following command to get the black hole of node dependencies:
```sh
npm install
```

## Step 2: WebAssembly
Generate the WebAssembly output
```sh
cd src
em++ engine.cpp -std=c++20 -O3 -o engine.js -s MODULARIZE=1 -s EXPORT_ES6=1 -s EXPORTED_FUNCTIONS='["_engine","_malloc","_free","_get_offset","_is_in_check"]' -s EXPORTED_RUNTIME_METHODS='["HEAPU8","HEAP8","setValue","getValue","stringToUTF8","lengthBytesUTF8"]' -s ENVIRONMENT=web --emit-tsd engine.d.ts
```

## Step 3: You're finished!
That wasn't very complicated, was it?