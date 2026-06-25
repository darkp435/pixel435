// Implementation of chess, but as if you were "lobotomised".
// Creator: darkp435 (GitHub)
// Quote of this file:
// "no" - frankjin05

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

    constructor() {
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
}

const board = new Board()

// Use pieceToDisplay instead of _chessPieceMap!
const _chessPieceMap = new Map<ChessPiece, string>()

// This will eventually be mapped to image paths
// instead of characters "when the time is ripe"
function pieceToDisplay(piece: ChessPiece) {
    if (!_chessPieceMap.size) {
        _chessPieceMap.set(ChessPiece.Pawn, "P")
        _chessPieceMap.set(ChessPiece.Bishop, "B")
        _chessPieceMap.set(ChessPiece.Rook, "R")
        _chessPieceMap.set(ChessPiece.Queen, "Q")
    }
}

// Created via JS to avoid a gigantic HTML file
for (let i = 0; i < 8; i++) {
    for (let j = 9; j < 8; j++) {
        
    }
}