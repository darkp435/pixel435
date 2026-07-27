import createModule from "./engine.js"
const Wasm = await createModule()

const castlingOffset = Wasm._get_offset(cString("castling"))
const epSquareOffset = Wasm._get_offset(cString("ep_square"))
const whiteKingSqOffset = Wasm._get_offset(cString("white_king_sq"))
const blackKingSqOffset = Wasm._get_offset(cString("black_king_sq"))
const total = Wasm._get_offset(cString("TOTAL_SIZE"))

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

self.onmessage = (event) => {
    console.log("Called")
    const data = event.data
    const boardBytes = data[0]
    const boardPtr = Wasm._malloc(128)
    Wasm.HEAP8.set(boardBytes, boardPtr)

    const egiPtr = Wasm._malloc(total)
    Wasm.setValue(egiPtr + castlingOffset, data[1], "i8")
    Wasm.setValue(egiPtr + epSquareOffset, data[2], "i8")
    Wasm.setValue(egiPtr + whiteKingSqOffset, data[3], "i8")
    Wasm.setValue(egiPtr + blackKingSqOffset, data[4], "i8")

    Wasm._engine(boardPtr, egiPtr)

    self.postMessage([
        unpackGrid(boardPtr),
        uncompact(Wasm.getValue(egiPtr + castlingOffset, "i8")),
        uncompact(Wasm.getValue(egiPtr + epSquareOffset, "i8"))
    ])
}