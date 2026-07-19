// Implementation of chess, but as if you were "lobotomised".
// Creator: darkp435 (GitHub)
// Quote of this file:
// "no" - frankjin05
//
// Devlog
// 25/06
// - Started working on project.
// - Started transpiling Frank's chess engine. Underestimated
//   how bad Frank's code was. Contemplating life choices.
// 26/06
// - Started working on actual chess logic until I realised
//   that it's gonna be an adventure writing it.
// - Continued transpilation of engine.c into engine.ts
// 29/06
// - Continued working on chess logic, specifically moves.
// - Realised handling castling and en passant was going
//   to be a big pain.
// 30/06
// - Worked on chess engine because I realised that the
//   chess logic was gonna be a pain.
// 01/07
// - Worked on chess engine and saw the pyramid of doom.
//   Severely regretted life choices. Why does Frank's
//   code have to be so bad??? Like, is there no other
//   way to write code without 4 levels of nested
//   if statements?
// 14/07
// - Wrote the logic for bishop, rook, pawn and queen
//   moves.
// 15/07
// - Fixed the logic for the aforementioned pieces
//   and add king moves. Man I hate off-by-one errors.
// - Switched to WebAssembly instead of manual
//   transpilation because I realised it's faster
//   and less painful.
// - Add actual icons for the chess pieces.
// - Wrote some CSS to make the website look good.
// 16/07
// - Added promotion
// - Added castling. There was a bug that led to
//   the king disappearing and it took about 30
//   minutes and all my sanity to fix.
// 17/07 - 19/07
// - Continued integrating chess engine

const chessBoard = document.getElementById("chess-board") as HTMLDivElement
import createModule from "./engine.js"
const Wasm = await createModule()
let botsTurn = false

const castlingOffset = Wasm._get_offset(cString("castling"))
const epSquareOffset = Wasm._get_offset(cString("ep_square"))
const whiteKingSqOffset = Wasm._get_offset(cString("white_king_sq"))
const blackKingSqOffset = Wasm._get_offset(cString("black_king_sq"))

class GridCoord {
    constructor(public row: number, public col: number) {}
    isEqual(row: number, col: number): boolean
    isEqual(other: GridCoord): boolean
    isEqual(_1: number | GridCoord, _2?: number) {
        if (_1 instanceof GridCoord) return _1.row === this.row && _1.col === this.col
        return _1 === this.row && _2 === this.col
    }
}

/**  Returns the absolute difference between two numbers. */
function difference(a: number, b: number) {
    return Math.abs(a - b)
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
        [null, null, null, null, null, null, null, null]
    ]

    let index = 0

    // Iterate our way downwards because for his board's first index is a8, not a1
    for (let row = 7; row > -1; row--) {
        for (let col = 0; col < 8; col++) {
            newBoard[row][col] = Wasm.getValue(boardPtr + index, "i8")
            index++
        }
        index += 8
    }

    return newBoard
}

/** Does the opposite of compact function: extracts the two integers */
function uncompact(byte: number) {
    return [byte >> 4, byte & 0xf]
}

// Values assigned to be compatible with engine.cpp
enum ChessPiece {
    WPawn = 1,
    WKnight = 2,
    WBishop = 3,
    WRook = 4,
    WQueen = 5,
    WKing = 6,
    BPawn = -1,
    BKnight = -2,
    BBishop = -3,
    BRook = -4,
    BQueen = -5,
    BKing = -6
}

// To be compatible with engine.cpp
enum Castle {
    Long = 0,
    Short = 1,
    None = 2,
    Both = 3
}

// Chess grid is 8x8 (obviously)
class Board {
    // Null means NO piece is there!
    private grid: Array<Array<ChessPiece | null>>
    private isTurn: boolean
    private castle: Castle
    private enPassant: GridCoord | null
    private blackCastle: Castle

    constructor() {
        this.isTurn = true
        this.enPassant = null
        this.castle = Castle.Both
        this.blackCastle = Castle.Both
        type CP = ChessPiece
        const CP = ChessPiece

        // NOTE: this is inverted due to array indexing!
        this.grid = [
            [CP.WRook, CP.WKnight, CP.WBishop, CP.WQueen, CP.WKing, CP.WBishop, CP.WKnight, CP.WRook],
            [CP.WPawn, CP.WPawn, CP.WPawn, CP.WPawn, CP.WPawn, CP.WPawn, CP.WPawn, CP.WPawn],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [CP.BPawn, CP.BPawn, CP.BPawn, CP.BPawn, CP.BPawn, CP.BPawn, CP.BPawn, CP.BPawn],
            [CP.BRook, CP.BKnight, CP.BBishop, CP.BQueen, CP.BKing, CP.BBishop, CP.BKnight, CP.BRook]
        ]
    }

    // Returns true if ONE of the provided coordinates isn't empty.
    coordsHasPiece(...coords: GridCoord[]) {
        for (const coord of coords) {
            if (this.getPiece(coord) !== null) return true
        }

        return false
    }

    getPiece(coord: GridCoord): ChessPiece | null
    getPiece(row: number, col: number): ChessPiece | null
    getPiece(id: string): ChessPiece | null
    getPiece(param1: number | GridCoord | string, col?: number): ChessPiece | null {
        if (param1 instanceof GridCoord) {
            return this.grid[param1.row][param1.col]
        }
        if (typeof(param1) === 'string') {
            const coord = idToGridCoord(param1)
            return this.grid[coord.row][coord.col]
        }
        if (col === undefined) {
            console.error("error: col wasn't provided! (getPiece)")
            return null
        }
        return this.grid[param1][col]
    }

    getPieceFromCoord(coord: GridCoord) {
        return this.grid[coord.row][coord.col]
    }

    setPiece(coord: GridCoord, piece: ChessPiece | null) {
        this.grid[coord.row][coord.col] = piece
    }

    /** Assuming enemy side is black. */
    isEnemyPiece(coord: GridCoord) {
        const piece = this.getPiece(coord)
        return piece === ChessPiece.BBishop || piece === ChessPiece.BKing || piece === ChessPiece.BKnight || piece === ChessPiece.BPawn || piece === ChessPiece.BQueen || piece === ChessPiece.BRook
    }

    executeEngine() {
        const params = this.getRequiredBotInfo()
        const boardPtr = params[0]
        const egiPtr = params[1]
        Wasm._engine(boardPtr, egiPtr)
        this.grid = unpackGrid(boardPtr)
        const castleUnpacked = uncompact(Wasm.getValue(egiPtr + castlingOffset, "u8"))
        this.castle = castleUnpacked[0]
        this.blackCastle = castleUnpacked[1]
        const epSquare = uncompact(Wasm.getValue(egiPtr + epSquareOffset, "u8"))
        this.enPassant = new GridCoord(epSquare[0], epSquare[1])
        Wasm._free(boardPtr)
        Wasm._free(egiPtr)
    }

    private _promotionHandler(coord: GridCoord, pieceType: ChessPiece) {
        document.querySelector(".promotion")!.remove()
        this.setPiece(coord, pieceType)
        document.getElementById(`${coord.row}-${coord.col}`)!.style.backgroundImage = `url(${pieceToDisplay(pieceType)})`
        botsTurn = true
        this.executeEngine()
        botsTurn = false
    }

    private _promote(coord: GridCoord) {
        const rect = document.getElementById(`${coord.row}-${coord.col}`)!.getBoundingClientRect()
        const promotionBox = document.createElement("div")
        promotionBox.classList.add("promotion")
        promotionBox.style.top = `${rect.top + 40}px`
        console.log(promotionBox.style.top)
        promotionBox.style.left = `${rect.right}px`
        console.log(promotionBox.style.left)
        document.body.appendChild(promotionBox)

        const queen = document.createElement("img")
        queen.src = "../assets/white-queen.png"
        queen.alt = "Q"
        queen.onclick = () => this._promotionHandler(coord, ChessPiece.WQueen)
        promotionBox.appendChild(queen)

        const rook = document.createElement("img")
        rook.src = "../assets/white-rook.png"
        rook.alt = "R"
        rook.onclick = () => this._promotionHandler(coord, ChessPiece.WRook)
        promotionBox.appendChild(rook)

        const knight = document.createElement("img")
        knight.src = "../assets/white-knight.png"
        knight.alt = "N"
        knight.onclick = () => this._promotionHandler(coord, ChessPiece.WKnight)
        promotionBox.appendChild(knight)

        const bishop = document.createElement("img")
        bishop.src = "../assets/white-bishop.png"
        bishop.alt = "B"
        bishop.onclick = () => this._promotionHandler(coord, ChessPiece.WBishop)
        promotionBox.appendChild(bishop)
    }

    private _checkPawnLegality(from: GridCoord, to: GridCoord): boolean {
        if ((to.row - from.row === 1 && difference(from.col, to.col) === 0 && this.getPiece(to) === null) || // One square forward
            (to.row - from.row === 1 && difference(from.col, to.col) === 1 && this.getPiece(to) !== null) // Regular capture
        ) {
            this.enPassant = null
            return true
        }

        if (to.row - from.row === 2 && 
            difference(from.col, to.col) === 0 && 
            from.row === 1 && 
            this.getPiece(to) === null 
            && this.getPiece(to.row - 1, to.col) === null
        ) {
            this.enPassant = new GridCoord(to.row, to.col)
            return true
        }

        // Special case: we check if the king will be in check due to this modifying the board.
        // En passant
        if (this.enPassant !== null && to.isEqual(this.enPassant)) {
            const clone = structuredClone(this.grid)
            clone[to.row][to.col] = ChessPiece.WPawn
            clone[from.row][from.col] = null
            clone[to.row - 1][to.col] = null
            if (this.isInCheck(clone)) return false
            this.setPiece(new GridCoord(this.enPassant.row, this.enPassant.col), null)
            this.enPassant = null
            return true
        }
        
        return false
    }

    // Transforms the chessboard to 0x88 encoding
    chessBoardTo88(): Int8Array
    chessBoardTo88(board: Array<Array<ChessPiece | null>>): Int8Array
    chessBoardTo88(board?: Array<Array<ChessPiece | null>>): Int8Array {
        const flattened = []
        // Init the array with all 0s
        for (let _ = 0; _ < 128; _++) {
            flattened.push(0)
        }
        for (let rank = 0; rank < 8; rank++) {
            for (let file = 0; file < 8; file++) {
                const index88 = rank * 16 + file
                // Number() is needed so that nulls get transformed into 0s
                flattened[index88] = Number(!board ? this.grid[rank][file] : board[rank][file])
            }
        }

        return new Int8Array(flattened)
    }

    private __isPieceInBetween(stop: number, condition: (i: number) => boolean) {
        for (let i = 1; i < stop; i++) {
            // This is needed because pieces move differently
            if (condition(i)) return true
        }
        return false
    }

    private _checkKnightLegality(from: GridCoord, to: GridCoord): boolean {
        return (
            (difference(from.col, to.col) === 2 && difference(from.row, to.row) === 1) ||
            (difference(from.row, to.row) === 2 && difference(from.col, to.col) === 1)
        )
    }

    private _checkBishopLegality(from: GridCoord, to: GridCoord): boolean {
        // Moving diagonally means that the col and row moved are equal.
        if (difference(from.col, to.col) !== difference(from.row, to.row)) return false
        // Now the pain part: checking every space to see if theres a piece in between.
        // Moved up right
        const displacement = difference(from.col, to.col)
        if (to.row > from.row && to.col > from.col) {
            if (this.__isPieceInBetween(displacement, (i) => this.getPiece(from.row + i, from.col + i) !== null)) return false
        // Moved up left
        } else if (to.row > from.row && from.col > to.col) {
            if (this.__isPieceInBetween(displacement, (i) => this.getPiece(from.row + i, from.col - i) !== null)) return false
        // Moved down left
        } else if (to.row < from.row && from.col > to.col) {
            if (this.__isPieceInBetween(displacement, (i) => this.getPiece(from.row - i, from.col - i) !== null)) return false
        // Moved down right
        } else {
            if (this.__isPieceInBetween(displacement, (i) => this.getPiece(from.row - i, from.col + i) !== null)) return false
        }
        return true;
    }

    private _checkRookLegality(from: GridCoord, to: GridCoord): boolean {
        // Castling is handled in _checkKingLegality because the user moves their king.
        if (difference(from.col, to.col) >= 1 && difference(from.row, to.row) >= 1) return false
        // Moving horizontally
        if (difference(from.row, to.row) === 0) {
            // Moving right
            if (to.col > from.col) {
                for (let i = from.col + 1; i < to.col; i++) {
                    if (this.getPiece(from.row, i) !== null) return false
                }
            } else {
                // Backwards check. We do not check the destination square because it can be captured.
                for (let i = to.col + 1; i < from.col; i++) {
                    if (this.getPiece(from.row, i) !== null) return false
                }
            }
        // Moving vertically
        } else {
            // Moving forwards
            if (to.row > from.row) {
                for (let i = from.row; i < from.row; i++) {
                    if (this.getPiece(from.row, i) !== null) return false
                }
            } else {
                // Moving bakwards
                for (let i = to.row + 1; i < from.row; i++) {
                    if (this.getPiece(from.row, i) !== null) return false
                }
            }
        }

        // Castling rights
        if (
            (!from.isEqual(0, 7) && !from.isEqual(0, 0)) ||
            // Castling rights already sacrificed
            this.castle == Castle.None
        ) return true

        // Castle.None is unreachable here.
        switch (this.castle) {
        case Castle.Both:
            if (from.isEqual(0, 0)) this.castle = Castle.Short
            if (from.isEqual(0, 7)) this.castle = Castle.Long
            break
        case Castle.Long:
            if (from.isEqual(0, 0)) this.castle = Castle.None
            break
        case Castle.Short:
            if (from.isEqual(0, 7)) this.castle = Castle.None
            break
        default:
            console.error("Error: unknown castling rights (checkRookLegality)!")
        }

        return true
    }

    private _checkQueenLegality(from: GridCoord, to: GridCoord): boolean {
        return this._checkBishopLegality(from, to) || this._checkRookLegality(from, to)
    }

    private _computeCastle(castleType: Castle, grid: Array<Array<ChessPiece | null>>) {
        grid[0][4] = null
        if (castleType === Castle.Long) {
            grid[0][2] = ChessPiece.WKing
            grid[0][0] = null
            grid[0][3] = ChessPiece.WRook
            if (grid == this.grid) {
                document.getElementById("0-0")!.style.backgroundImage = 'none'
                document.getElementById("0-4")!.style.backgroundImage = 'none'
                document.getElementById("0-2")!.style.backgroundImage = `url(${pieceToDisplay(ChessPiece.WKing)})`
                document.getElementById("0-3")!.style.backgroundImage = `url(${pieceToDisplay(ChessPiece.WRook)})`
            }
        } else {
            grid[0][6] = ChessPiece.WKing
            grid[0][7] = null
            grid[0][5] = ChessPiece.WRook
            if (grid == this.grid) {
                document.getElementById("0-7")!.style.backgroundImage = 'none'
                document.getElementById("0-4")!.style.backgroundImage = 'none'
                document.getElementById("0-6")!.style.backgroundImage = `url(${pieceToDisplay(ChessPiece.WKing)})`
                document.getElementById("0-5")!.style.backgroundImage = `url(${pieceToDisplay(ChessPiece.WRook)})`
            }
        }

        return grid
    }

    private isInCheck(grid: Array<Array<ChessPiece | null>>) {
        const board88 = this.chessBoardTo88(grid)
        const buf = Wasm._malloc(128)
        Wasm.HEAP8.set(board88, buf)
        const kingPos = this.search(ChessPiece.WKing, grid)
        const res = Wasm._is_in_check(buf, 1, compact(kingPos.row, kingPos.col))
        Wasm._free(buf)
        return Boolean(res)
    }

    // Need to check conditions #1, #2 and #4
    private _castle(castleType: Castle) {
        const newGrid = structuredClone(this.grid)
        // #1 The king cannot castle out of check

        if (this.isInCheck(newGrid)) return false
        // #2 The king cannot castle through check
        newGrid[0][4] = null

        if (castleType === Castle.Long) newGrid[0][3] = ChessPiece.WKing
        else newGrid[0][5] = ChessPiece.WKing

        if (this.isInCheck(newGrid)) return false
        // #4 All squares in the path must be empty
        if (
            (castleType === Castle.Long && this.coordsHasPiece(new GridCoord(0, 1), new GridCoord(0, 2), new GridCoord(0, 3))) ||
            (castleType === Castle.Short && this.coordsHasPiece(new GridCoord(0, 5), new GridCoord(0, 6)))
        ) return false
        // Remember, the king can't walk into check
        if (this.isInCheck(this._computeCastle(castleType, structuredClone(this.grid)))) return false
        this.castle = Castle.None
        this._computeCastle(castleType, this.grid)
        return true
    }

    //! FIXME: the king can at the moment castle with an enemy rook!
    private _checkKingLegality(from: GridCoord, to: GridCoord): boolean {
        // Special move: castling
        
        const offsets = [
            [0, -1], [0, 1], [1, 0], [-1, 0],
            [1, 1], [1, -1], [-1, 1], [-1, -1]
        ]

        for (const offset of offsets) {
            const coord = new GridCoord(to.row + offset[0], to.col + offset[1])
            if (coord.isEqual(from)) {
                this.castle = Castle.None
                return true
            }
        }

        // The only legal move at this point is castling.
        // Conditions:
        // #1 The king cannot castle through check
        // #2 The king cannot castle out of check
        // #3 Both the king and the rook can'tve moved previously
        // #4 All squares in the path must be empty
        // Castling is done by moving king two squares horizontally in this game.

        // Not castle or no castling rights - illegal
        if (difference(from.col, to.col) !== 2 || difference(from.row, to.row) !== 0 || this.castle === Castle.None) {
            return false
        }

        // Attempted castle. this.castle is NOT None here
        // Attempted long castle
        // Condition #1: both the king and the rook can'tve moved previously
        if (to.col === 2) {
            if (this.castle === Castle.Short) return false
            if (!this._castle(Castle.Long)) return false
        // Attempted short castle
        } else {
            if (this.castle === Castle.Long) return false
            if (!this._castle(Castle.Short)) return false
        }

        return true;
    }

    private isLegalMove(from: GridCoord, to: GridCoord): boolean {
        if (!this.isTurn || 
            from.isEqual(to) || 
            this.getPieceFromCoord(from) === null ||
            // Moving outside of the board
            to.col > 7 ||
            to.col < 0 ||
            to.row > 7 ||
            to.col < 0
        ) {
            return false
        }

        const piece = this.getPieceFromCoord(from)
        // This could probably be done via polymorphism
        // but that's for future me
        switch (piece) {
        case ChessPiece.WPawn:
            if (!this._checkPawnLegality(from, to)) return false
            break
        case ChessPiece.WKnight:
            if (!this._checkKnightLegality(from, to)) return false
            this.enPassant = null
            break
        case ChessPiece.WBishop:
            if (!this._checkBishopLegality(from, to)) return false
            this.enPassant = null
            break
        case ChessPiece.WRook:
            if (!this._checkRookLegality(from, to)) return false
            this.enPassant = null
            break
        case ChessPiece.WQueen:
            if (!this._checkQueenLegality(from, to)) return false
            this.enPassant = null
            break
        case ChessPiece.WKing:
            if (!this._checkKingLegality(from, to)) return false
            this.enPassant = null
            break
        default:
            // Shouldn't run.
            console.error("isLegalMove: side is black/unknown piece!")
            return false
        }

        const clone = structuredClone(this.grid)
        clone[from.row][from.col] = null
        clone[to.row][to.col] = piece
        if (this.isInCheck(clone)) return false

        return true
    }

    move(from: GridCoord, to: GridCoord) {
        const pieceType = this.getPiece(from)

        if (!this.isLegalMove(from, to)) {
            return
        }

        // Promotion
        if (pieceType === ChessPiece.WPawn && to.row === 7) {
            this._promote(to)
        } else {
            botsTurn = true
            this.executeEngine()
            botsTurn = false
        }

        this.setPiece(from, null)
        document.getElementById(`${from.row}-${from.col}`)!.style.backgroundImage = "none"
        this.setPiece(to, pieceType)
        const display = pieceToDisplay(pieceType)
        document.getElementById(`${to.row}-${to.col}`)!.style.backgroundImage = display === '' ? 'none' : `url(${display})`
        // console.log(this.getPiece(0, 4));
        // console.log(this.getPiece(0, 6));
    }

    // For the engine
    private gridCoordToSquare(coord: GridCoord) {
        return compact(coord.row, coord.col)
    }

    // Used for white and black king for getRequiredBotInfo
    private search(piece: ChessPiece, customBoard?: Array<Array<ChessPiece | null>>) {
        const desiredBoard = customBoard ? customBoard : this.grid

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (desiredBoard[row][col] === piece) return new GridCoord(row, col)
            }
        }

        // Shouldn't happen
        return new GridCoord(-1, -1)
    }

    getRequiredBotInfo() {
        const boardBytes = this.chessBoardTo88()
        const boardPtr = Wasm._malloc(128)
        Wasm.HEAP8.set(boardBytes, boardPtr)
        const total = cString("TOTAL_SIZE")
        const egiPtr = Wasm._malloc(Wasm._get_offset(total))
        Wasm.setValue(egiPtr + castlingOffset, compact(this.castle, this.blackCastle), "u8")
        if (this.enPassant === null) Wasm.setValue(egiPtr + epSquareOffset, 0, "u8")
        else Wasm.setValue(egiPtr + epSquareOffset, this.gridCoordToSquare(this.enPassant), "u8")
        Wasm.setValue(egiPtr + whiteKingSqOffset, this.gridCoordToSquare(this.search(ChessPiece.WKing)), "u8")
        Wasm.setValue(egiPtr + blackKingSqOffset, this.gridCoordToSquare(this.search(ChessPiece.BKing)), "u8")
        return [boardPtr, egiPtr]
    }
}

function cString(str: string) {
    const size = Wasm.lengthBytesUTF8(str) + 1
    const ptr = Wasm._malloc(size)
    Wasm.stringToUTF8(str, ptr, size)
    return ptr
}

console.log("Dev version 4")
const board = new Board()

// Use pieceToDisplay instead of _chessPieceMap!
const _chessPieceMap = new Map<ChessPiece, string>()

function pieceToDisplay(piece: ChessPiece | null) {
    if (!_chessPieceMap.size) {
        // Should be an image of a black pawn on a chessboard
        _chessPieceMap.set(ChessPiece.WPawn, "../assets/white-pawn.png")
        // Should be an image of a Scottish castle
        _chessPieceMap.set(ChessPiece.WBishop, "../assets/white-bishop.png")
        // Should be a Microsoft Paint drawn art that remotely resembles a bishop
        _chessPieceMap.set(ChessPiece.WRook, "../assets/white-rook.png")
        // Should be an image of Cassie, an NPC from the Roblox game Block Tales
        _chessPieceMap.set(ChessPiece.WQueen, "../assets/white-queen.png")
        // Should be an image of a white horse
        _chessPieceMap.set(ChessPiece.WKnight, "../assets/white-knight.png")
        // Should be an image of Aragorn, a character from Lord of the Rings
        _chessPieceMap.set(ChessPiece.WKing, "../assets/white-king.png")
        // Should be an image of a black pawn on a chessboard
        _chessPieceMap.set(ChessPiece.BPawn, "../assets/black-pawn.png")
        // Should be an image of a brown horse
        _chessPieceMap.set(ChessPiece.BKnight, "../assets/black-knight.png")
        // Should be the inverted image of the aforementioned white bishop
        _chessPieceMap.set(ChessPiece.BBishop, "../assets/black-bishop.png")
        // Should be the inverted image of the aforementioned white rook
        _chessPieceMap.set(ChessPiece.BRook, "../assets/black-rook.png")
        // Should be the inverted, and quality-reduced image of the aforementioned white queen
        _chessPieceMap.set(ChessPiece.BQueen, "../assets/black-queen.png")
        // Should be the inverted image of the aforementioned white king
        _chessPieceMap.set(ChessPiece.BKing, "../assets/black-king.png")
    }
    if (piece === null) {
        return ""
    }
    return _chessPieceMap.get(piece) || ""
}

function idToGridCoord(id: string) {
    const split = id.split('-')
    return new GridCoord(parseInt(split[0]), parseInt(split[1]))
}

function compact(num1: number, num2: number) {
    return ((num1 & 0xf) << 4) | (num2 & 0xf)
}

const domBoard = document.getElementById("chess-board") as HTMLDivElement

// Created via JS to avoid a gigantic HTML file
// Text tile color
let black = true
for (let i = 7; i > -1; i--) {
    black = !black
    for (let j = 0; j < 8; j++) {
        const square = document.createElement("button")
        square.id = `${i}-${j}`
        const display = pieceToDisplay(board.getPiece(i,j))
        square.style.backgroundImage = display === '' ? 'none' : `url(${display})`
        square.classList.add("chess-button")
        square.classList.add(black ? "black-tile" : "white-tile")
        black = !black
        chessBoard.appendChild(square)
    }
}

let selectedElement: GridCoord | undefined

domBoard.addEventListener('click', (event) => {
    if (!botsTurn && event.target && event.target instanceof Element && event.target.matches(".chess-button")) {
        const target = event.target
        const id = target.id
        const piece = board.getPiece(id)
        const coord = idToGridCoord(id)
        if (selectedElement && (board.isEnemyPiece(coord) || piece === null)) {
            board.move(selectedElement, coord)
        } else {
            selectedElement = coord
        }
    }
})