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

const chessBoard = document.getElementById("chess-board") as HTMLDivElement
import createModule from "./engine.js"
const Module = await createModule()

class GridCoord {
    constructor(public row: number, public col: number) {}
    isEqual(other: GridCoord) {
        return other.row == this.row && other.col == this.col
    }
}

/**  Returns the absolute difference between two numbers. */
function difference(a: number, b: number) {
    return Math.abs(a - b)
}

enum ChessPiece {
    WPawn,
    WKnight,
    WBishop,
    WRook,
    WQueen,
    WKing,
    BPawn,
    BKnight,
    BBishop,
    BRook,
    BQueen,
    BKing
}

enum Castle {
    Long,
    Short,
    None,
    Both
}

// Chess grid is 8x8 (obviously)
class Board {
    // Null means NO piece is there!
    private grid: Array<Array<ChessPiece | null>>
    private isTurn: boolean
    private castle: Castle
    private enPassant: GridCoord | null

    constructor() {
        this.isTurn = true
        this.enPassant = null
        this.castle = Castle.Both
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

    private _promote(coord: GridCoord) {

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
            this.enPassant = new GridCoord(to.row - 1, to.col)
            return true
        }

        // En passant
        if (this.enPassant !== null && to.isEqual(this.enPassant)) {
            this.setPiece(new GridCoord(this.enPassant.row - 1, this.enPassant.col), null)
            this.enPassant = null
            return true
        }
        
        return false
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
        return true;
    }

    private _checkQueenLegality(from: GridCoord, to: GridCoord): boolean {
        return this._checkBishopLegality(from, to) || this._checkRookLegality(from, to)
    }

    private _checkKingLegality(from: GridCoord, to: GridCoord): boolean {
        // Special move: castling
        // Conditions:
        // 1. The king cannot castle through check
        // 2. The king cannot castle out of check
        // 3. Both the king and the rook can'tve moved previously
        // 4. All squares in the path must be empty
        // Castling is done by moving king two squares horizontally in this game.
        
        const offsets = [
            [0, -1], [0, 1], [1, 0], [-1, 0],
            [1, 1], [1, -1], [-1, 1], [-1, -1]
        ]

        for (const offset of offsets) {
            const coord = new GridCoord(to.row + offset[0], to.col + offset[1])
            if (coord.isEqual(from)) return true
        }
        return false;
    }

    // For player only
    private leavesKingInCheck(from: GridCoord, to: GridCoord): boolean {
        return false;
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

        return true
    }

    move(from: GridCoord, to: GridCoord) {
        if (!this.isLegalMove(from, to)) {
            return
        }

        const pieceType = this.getPiece(from)
        this.setPiece(from, null)
        document.getElementById(`${from.row}-${from.col}`)!.textContent = ""
        this.setPiece(to, pieceType)
        document.getElementById(`${to.row}-${to.col}`)!.textContent = pieceToDisplay(pieceType)
    }
}

const board = new Board()

// Use pieceToDisplay instead of _chessPieceMap!
const _chessPieceMap = new Map<ChessPiece, string>()

// This will eventually be mapped to image paths
// instead of characters "when the time is ripe"
function pieceToDisplay(piece: ChessPiece | null) {
    if (!_chessPieceMap.size) {
        _chessPieceMap.set(ChessPiece.WPawn, "WP")
        _chessPieceMap.set(ChessPiece.WBishop, "WB")
        _chessPieceMap.set(ChessPiece.WRook, "WR")
        _chessPieceMap.set(ChessPiece.WQueen, "WQ")
        _chessPieceMap.set(ChessPiece.WKnight, "WN")
        _chessPieceMap.set(ChessPiece.WKing, "WK")
        _chessPieceMap.set(ChessPiece.BPawn, "BP")
        _chessPieceMap.set(ChessPiece.BKnight, "BN")
        _chessPieceMap.set(ChessPiece.BBishop, "BB")
        _chessPieceMap.set(ChessPiece.BRook, "BR")
        _chessPieceMap.set(ChessPiece.BQueen, "BQ")
        _chessPieceMap.set(ChessPiece.BKing, "BK")
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

const domBoard = document.getElementById("chess-board") as HTMLDivElement

// Created via JS to avoid a gigantic HTML file
// Text tile color
let black = true
for (let i = 7; i > -1; i--) {
    black = !black
    for (let j = 0; j < 8; j++) {
        const square = document.createElement("button")
        square.id = `${i}-${j}`
        square.textContent = pieceToDisplay(board.getPiece(i, j))
        square.classList.add("chess-button")
        square.classList.add(black ? "black-tile" : "white-tile")
        black = !black
        chessBoard.appendChild(square)
    }
}

let selectedElement: GridCoord | undefined

domBoard.addEventListener('click', (event) => {
    if (event.target && event.target instanceof Element && event.target.matches(".chess-button")) {
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