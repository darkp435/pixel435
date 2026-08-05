import { MainModule } from "./engine"

// import createModule, { MainModule } from "./engine.js"
let Wasm: MainModule
// const Wasm = await createModule()

let epSquareOffset: number
let castlingOffset: number
let whiteKingSqOffset: number
let blackKingSqOffset: number
let total: number

/** Does the opposite of compact function: extracts the two integers */
function uncompact(byte: number) {
    return [byte >> 4, byte & 0xf]
}

/** Unpacks the 0x88 chess board into normal form and returns it. */
function unpackGrid(boardPtr: number) {
    // Values don't matter but null just to be safe
    const newBoard = [
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null]
    ]

    let index = 0

    // Iterate our way downwards because for his board's first index is a8, not a1
    for (let row = 7; row > -1; row--) {
        for (let col = 0; col < 8; col++) {
            const val = Wasm.getValue(boardPtr + index, "i8")
            if (val === 0) newBoard[row][col] = null
            else newBoard[row][col] = val
            index++
        }
        index += 8
    }

    return newBoard
}

function cString(str: string) {
    const size = Wasm.lengthBytesUTF8(str) + 1
    const ptr = Wasm._malloc(size)
    Wasm.stringToUTF8(str, ptr, size)
    return ptr
}

self.onmessage = async (event) => {
    // console.log("Called")
    const data = event.data
    const boardBytes = data[0]
    if (Wasm === undefined) {
        // import(event.data[5] ? "./engine-boosted.js" : "./engine.js").then(module => {
        //     module.default().then(wasm as MainModule => Wasm = wasm)
        // })
        if (event.data[5]) {
            const module = await import("./engine-boosted.js")
            Wasm = await module.default()
            // import("./engine-boosted.js").then(module => {
            //     module.default().then(wasm => Wasm = wasm)
            // })
        } else {
            const module = await import("./engine.js")
            Wasm = await module.default()
            // import("./engine.js").then(module => {
            //     module.default().then(wasm => Wasm = wasm)
            // })
        }
    }

    if (castlingOffset === undefined) {
        castlingOffset = Wasm._get_offset(cString("castling"))
        epSquareOffset = Wasm._get_offset(cString("ep_square"))
        whiteKingSqOffset = Wasm._get_offset(cString("white_king_sq"))
        blackKingSqOffset = Wasm._get_offset(cString("black_king_sq"))
        total = Wasm._get_offset(cString("TOTAL_SIZE"))
    }

    const boardPtr = Wasm._malloc(128)
    Wasm.HEAP8.set(boardBytes, boardPtr)

    const egiPtr = Wasm._malloc(total)
    Wasm.setValue(egiPtr + castlingOffset, data[1], "i8")
    Wasm.setValue(egiPtr + epSquareOffset, data[2], "i8")
    Wasm.setValue(egiPtr + whiteKingSqOffset, data[3], "i8")
    Wasm.setValue(egiPtr + blackKingSqOffset, data[4], "i8")

    const res = Wasm._engine(boardPtr, egiPtr)

    self.postMessage([
        unpackGrid(boardPtr),
        uncompact(Wasm.getValue(egiPtr + castlingOffset, "i8")),
        uncompact(Wasm.getValue(egiPtr + epSquareOffset, "i8")),
        res
    ])
}