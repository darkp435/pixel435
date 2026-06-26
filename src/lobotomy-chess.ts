// Implementation of chess, but as if you were "lobotomised".
// Creator: darkp435 (GitHub)
// Quote of this file:
// "no" - frankjin05
// Devlog
// 25 June
// - Started working on project.
// - Started transpiling Frank's chess engine. Underestimated
//   how bad Frank's code was. Contemplating life choices.

const chessBoard = document.getElementById("chess-board") as HTMLDivElement

class GridCoord {
    constructor(public row: number, public col: number) {}
    isEqual(other: GridCoord) {
        return other.row == this.row && other.col == this.col
    }
}

enum ChessPiece {
    Pawn,
    Knight,
    Bishop,
    Rook,
    Queen,
    King
}

// Chess grid is 8x8 (obviously)
class Board {
    // Null means NO piece is there!
    private grid: Array<Array<ChessPiece | null>>
    private isTurn: boolean

    constructor() {
        this.isTurn = true
        type CP = ChessPiece
        const CP = ChessPiece

        // NOTE: this is inverted due to array indexing!
        this.grid = [
            [CP.Rook, CP.Knight, CP.Bishop, CP.King, CP.Queen, CP.Bishop, CP.Knight, CP.Rook],
            [CP.Pawn, CP.Pawn, CP.Pawn, CP.Pawn, CP.Pawn, CP.Pawn, CP.Pawn, CP.Pawn],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [CP.Pawn, CP.Pawn, CP.Pawn, CP.Pawn, CP.Pawn, CP.Pawn, CP.Pawn, CP.Pawn],
            [CP.Rook, CP.Knight, CP.Bishop, CP.King, CP.Queen, CP.Bishop, CP.Knight, CP.Rook]
        ]
    }

    getPiece(row: number, col: number) {
        return this.grid[row][col]
    }

    getPieceFromCoord(coord: GridCoord) {
        return this.grid[coord.row][coord.col]
    }

    setPiece(coord: GridCoord, piece: ChessPiece | null) {
        this.grid[coord.row][coord.col]
    }

    private _checkPawnLegality(from: GridCoord, to: GridCoord): boolean {
        return true;
    }

    private isLegalMove(from: GridCoord, to: GridCoord): boolean {
        if (!this.isTurn || from.isEqual(to) || this.getPieceFromCoord(from) === null) {
            return false
        }

        const piece = this.getPieceFromCoord(from)
        switch (piece) {
            case ChessPiece.Pawn:
                if (!this._checkPawnLegality(from, to)) return false;
                break
            case ChessPiece.Knight:
                break
            case ChessPiece.Bishop:
                break
            case ChessPiece.Rook:
                break
            case ChessPiece.Queen:
                break
            case ChessPiece.King:
                break
            default:
                // Shouldn't run.
                console.error("isLegalMove: unknown piece!")
        }

        return true
    }

    move(from: GridCoord, to: GridCoord) {
        if (!this.isLegalMove(from, to)) {
            return
        }
    }
}

const board = new Board()

// Use pieceToDisplay instead of _chessPieceMap!
const _chessPieceMap = new Map<ChessPiece, string>()

// This will eventually be mapped to image paths
// instead of characters "when the time is ripe"
function pieceToDisplay(piece: ChessPiece | null) {
    if (!_chessPieceMap.size) {
        _chessPieceMap.set(ChessPiece.Pawn, "P")
        _chessPieceMap.set(ChessPiece.Bishop, "B")
        _chessPieceMap.set(ChessPiece.Rook, "R")
        _chessPieceMap.set(ChessPiece.Queen, "Q")
        _chessPieceMap.set(ChessPiece.Knight, "N")
        _chessPieceMap.set(ChessPiece.King, "K")
    }
    if (piece === null) {
        return ""
    }
    return _chessPieceMap.get(piece) || ""
}

// Created via JS to avoid a gigantic HTML file
for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
        let square = document.createElement("button")
        square.id = `${i}-${j}`
        square.textContent = pieceToDisplay(board.getPiece(i, j))
        chessBoard.appendChild(square)
    }
}