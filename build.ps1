$mode = $args[0]

cd src
em++ engine.cpp -std=c++20 -O3 -o engine.js -s MODULARIZE=1 -s EXPORT_ES6=1 -s -DNDEBUG -flto -fno-exceptions -fno-rtti -ffast-math -s ASSERTIONS=0 -s FILESYSTEM=0 -s MALLOC=emmalloc -s EXPORTED_FUNCTIONS='["_malloc","_free"]' -s EXPORTED_RUNTIME_METHODS='["HEAPU8","HEAP8","setValue","getValue","stringToUTF8","lengthBytesUTF8"]' -s ENVIRONMENT=web --emit-tsd engine.d.ts
em++ engine.cpp -std=c++20 -O3 -o engine-boosted.js -s MODULARIZE=1 -s EXPORT_ES6=1 -s -DNDEBUG -flto -fno-exceptions -fno-rtti -ffast-math -s ASSERTIONS=0 -s FILESYSTEM=0 -s MALLOC=emmalloc -s EXPORTED_FUNCTIONS='["_malloc","_free"]' -s EXPORTED_RUNTIME_METHODS='["HEAPU8","HEAP8","setValue","getValue","stringToUTF8","lengthBytesUTF8"]' -s ENVIRONMENT=web --emit-tsd engine-boosted.d.ts -DBOOSTED

if ($mode -eq "prod") {
    echo "Running in prod mode"
    npm run build
} else {
    echo "Running in test mode"
    npm run test
}
cd ..
