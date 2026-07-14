// TypeScript implementation of Frank's chess engine.
// It is a direct transpilation of engine.c found
// in the rootdir of this project (or previously
// found, if it has been deleted).
// Quote of this file:
// "Don't ask me, ask past me." - Frank, the madman
// who created the chess engine
//
// It would be foolish to attempt to modify this after
// this has been finished except to patch bugs, and even
// that is risky. This file is where readability goes to
// die.

// JavaScript (and TypeScript) do not support pointers like
// C does, which is a problem because the original C code
// (expectly) uses pointers.
//
// As a workaround, arrays in JS are sent to functions via
// reference instead of copy (like numbers or strings). So
// we pass a length 1 array to a function and treat arr[0]
// as the value.
//
// The following type is used to indicate that the array
// is being used like a POINTER, not an ARRAY.
type NumPointer = Array<number>

const ENGINE_NAME = "FLEDGLING 1.0"
const EMPTY  = 0
const WP =  1
const WN = 2
const WB = 3
const WR = 4
const WQ = 5
const WK = 6
const BP = -1
const BN = -2
const BB = -3
const BR = -4
const BQ = -5
const BK = -6
const WHITE = 1
const BLACK = -1
const FLAG_NONE = 0
const FLAG_PROMO_N = 4
const FLAG_PROMO_B = 5
const FLAG_PROMO_R = 6
const FLAG_PROMO_Q = 7
const FLAG_DOUBLE_STEP = 8
const FLAG_CASTLE_S = 9
const FLAG_CASTLE_L = 10
const FLAG_EP = 12
const MAX_MOVES = 256
const MAX_Q_MOVES = 128
const MAX_DEPTH = 6
const MAX_Q_DEPTH = 6
const MAX_EXT = 3
const MAX_EFFECTIVE_DEPTH = 9
const NULL_MOVE_R = 2
const NULL_MOVE_THRESHOLD = 3
const LATE_MOVE_DEPTH_CUTOFF = 2
const LATE_MOVE_THRESHOLD = 4
const DELTA_MARGIN = 200 
const oo = 32767
const MATE = 32000
const PHASE_MAXIMUM = 256
const ISOLATION_PENALTY = 15
const PASSED_REWARD = 50
const SAFETY_BONUS = 10
const OPEN_FILE_KING_PENALTY = 20
const ORDER_LIMIT = 6
const TT_MASK = 1023
const TT_FLAG_EXACT = 0
const TT_FLAG_LOWER = 1
const TT_FLAG_UPPER = 2


const sq_tbl = [    
    0,  1,  2,  3,  4,  5,  6,  7,  0,  0,  0,  0,  0,  0,  0,  0,
    8,  9,  10, 11, 12, 13, 14, 15, 0,  0,  0,  0,  0,  0,  0,  0,
    16, 17, 18, 19, 20, 21, 22, 23, 0,  0,  0,  0,  0,  0,  0,  0,
    24, 25, 26, 27, 28, 29, 30, 31, 0,  0,  0,  0,  0,  0,  0,  0,
    32, 33, 34, 35, 36, 37, 38, 39, 0,  0,  0,  0,  0,  0,  0,  0,
    40, 41, 42, 43, 44, 45, 46, 47, 0,  0,  0,  0,  0,  0,  0,  0,
    48, 49, 50, 51, 52, 53, 54, 55, 0,  0,  0,  0,  0,  0,  0,  0,
    56, 57, 58, 59, 60, 61, 62, 63, 0,  0,  0,  0,  0,  0,  0,  0
];

const sq_tbl_c = [
    56, 57, 58, 59, 60, 61, 62, 63, 0,  0,  0,  0,  0,  0,  0,  0,
    48, 49, 50, 51, 52, 53, 54, 55, 0,  0,  0,  0,  0,  0,  0,  0,
    40, 41, 42, 43, 44, 45, 46, 47, 0,  0,  0,  0,  0,  0,  0,  0,
    32, 33, 34, 35, 36, 37, 38, 39, 0,  0,  0,  0,  0,  0,  0,  0,
    24, 25, 26, 27, 28, 29, 30, 31, 0,  0,  0,  0,  0,  0,  0,  0,
    16, 17, 18, 19, 20, 21, 22, 23, 0,  0,  0,  0,  0,  0,  0,  0,
    8,  9,  10, 11, 12, 13, 14, 15, 0,  0,  0,  0,  0,  0,  0,  0,
    0,  1,  2,  3,  4,  5,  6,  7,  0,  0,  0,  0,  0,  0,  0,  0
];

// NOTE: these were originally macro functions in the original file.
function SIGN(X: number) {
    return Number(X > 0) - Number(X < 0)
}

function TO_6BIT(X: number) {
    return sq_tbl[X]
}

function TO_6BIT_C(X: number) {
    return sq_tbl_c[X]
}

function ENCODE_MOVE(SF: number, T: number, F: number) {
    return (SF << 12) | (T << 6) | F
}

function DECODE_DEST(X: number) {
    return ((X & 0x0E00) >> 5) | ((X & 0x01C0) >> 6)
}

function DECODE_FROM(X: number) {
    return ((X & 56) << 1) | (X & 7)
}

function ZOBRIST_CASTLE(rights: number) {
    return rights * 0x85ebca6b
}

function ZOBRIST_EP(ep_square: number) {
    return (ep_square + 1) * 0xc2b2ae35
}

function ZOBRIST_PIECE_FIX(PIECE: number) {
    return PIECE > 0 ? PIECE - 1 : -PIECE - 1 + 6
}

// It's unfortunate, but ExtraGameInfo and Undo must be exported as they are
// params for engine()
export class ExtraGameInfo {
    constructor(
        public castling: number,
        public ep_square: number,
        public halfmove_clock: number,
        public fullmove_clock: number,
        public side_to_move: number,
        public white_king_sq: number,
        public black_king_sq: number,
        public white_pawn_struct: number,
        public black_pawn_struct: number,
        public white_pawn_score: number,
        public black_pawn_score: number,
        public white_king_safety: number,
        public black_king_safety: number,
        public phase: number,
        public mg_eval: number,
        public eg_modifier: number,
        public hash: number
    ) {}
}

export class Undo {
    constructor(
        public move: number,
        public captured: number,
        public castling: number,
        public ep_square: number,
        public halfmove_clock: number,
        public fullmove_clock: number,
        public side_to_move: number,
        public white_king_sq: number,
        public black_king_sq: number,
        public white_pawn_struct: number,
        public black_pawn_struct: number,
        public white_pawn_score: number,
        public black_pawn_score: number,
        public white_king_safety: number,
        public black_king_safety: number,
        public phase: number,
        public mg_eval: number,
        public eg_modifier: number,
        public hash: number
    ) {}
}

class Metrics {
    constructor(
        public total_nodes: number,
        public horizon_nodes: number,
        public q_nodes: number,
        public beta_cutoffs: number,
        public extensions: number,
        public tt_hits: number,
        public final_eval: number
    ) {}
}

class TTEntry {
    constructor(
        public key: number,
        public score: number,
        public best_move: number,
        public depth: number,
        public flag: number
    ) {}
}

const mg_pawn_table = [
     0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
    5,  5, 10, 25, 25, 10,  5,  5,
    0,  0,  0, 20, 20,  0,  0,  0,
    5, -5,-10,  5,  5,-10, -5,  5,
    5, 10, 10,-20,-20, 20, 10,  5,
    0,  0,  0,  0,  0,  0,  0,  0
];

const eg_pawn_table = [
    0,  0,  0,  0,  0,  0,  0,  0,
    30, 30, 30, 30, 30, 30, 30, 30,
    40, 40, 30, 20, 20, 30, 40, 40,
    25, 25, 20,  5,  5, 20, 25, 25,
    20, 20, 20,  0,  0, 20, 20, 20,
    5,  15, 20,  5,  5, 20, 15,  5,
    5,  0,  0, 30, 30,-10,  0,  5,
    0,  0,  0,  0,  0,  0,  0,  0
];

const knight_table = [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -50,-20,-30,-30,-30,-30,-20,-50,
];

const bishop_table = [
    -20,-10,-10,-10,-10,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5, 10, 10,  5,  0,-10,
    -10,  5,  5, 10, 10,  5,  5,-10,
    -10,  0, 10, 10, 10, 10,  0,-10,
    -10, 10, 10,  0,  0, 10, 10,-10,
    -10,  5,  0,  0,  0,  0,  5,-10,
    -20,-10,-10,-10,-10,-10,-10,-20,
];

const rook_table = [
     0,  0,  0,  0,  0,  0,  0,  0,
     5, 10, 10, 10, 10, 10, 10,  5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5, -5, -5,  0,  0, -5, -5, -5
];

const queen_table = [
    -20,-10,-10, -5, -5,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5,  5,  5,  5,  0,-10,
    -5,  0,  5,  5,  5,  5,  0, -5,
     0,  0,  5,  5,  5,  5,  0, -5,
    -10,  5,  5,  5,  5,  5,  0,-10,
    -10,  0,  5,  0,  0,  0,  0,-10,
    -20,-10,-10, -5, -5,-10,-10,-20
];

const mg_king_table = [
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -20,-30,-30,-40,-40,-30,-30,-20,
    -10,-20,-20,-20,-20,-20,-20,-10,
    20, 20,  0,  0,  0,  0, 20, 20,
    20, 30, 20,  0,  5, 10, 30, 20
];

const eg_king_table = [
     10, 30, 30, 40, 40, 30, 30, 10,
     25, 40, 45, 55, 55, 45, 40, 25,
     20, 35, 60, 80, 80, 60, 35, 20,
     15, 30, 75, 95, 95, 75, 30, 15,
      0, 15, 60, 80, 80, 60, 15,  0,
    -15,  0, 40, 45, 45, 40,  0,-15,
    -50,-45,  0,  0,  0,  0,-45,-50,
    -70,-60,-50,-30,-30,-40,-60,-70
];

const null_pst = [
    0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0
];

const ZOBRIST_SIDE = 0x9e3779b9

const mg_table_atlas = [null_pst, mg_pawn_table, knight_table, bishop_table, rook_table, queen_table, mg_king_table]
const eg_table_atlas = [null_pst, eg_pawn_table, null_pst, null_pst, null_pst, null_pst, eg_king_table]
const piece_values = [0, 100, 320, 330, 500, 900, 0]
const PROMOTION_VALUES = [2, 3, 5, 9]
const phase_weight = [0, 0, 11, 11, 21, 42, 0]
const doubled_penalty = [0, 0, 20, 20, 20, 20, 20, 20]
const MVV_LVA = [
    [0, 0, 0, 0, 0, 0, 0],
    [0, 9, 8, 7, 5, 1, 0],
    [0,31,30,29,27,23,20],
    [0,32,31,30,28,24,21],
    [0,49,48,47,45,41,40],
    [0,89,88,87,85,81,80],
    [0,0,0,0,0,0,0] // Consistency also died here apparently.
]

const knight_moves = [31, 33, 14, 18, -31, -33, -14, -18];
const queen_moves = [15, 16, 17, 1, -15, -16, -17, -1];
const queen_rays = [
    [15, 30, 45, 60, 75, 90, 105],
    [16, 32, 48, 64, 80, 96, 112],
    [17, 34, 51, 68, 85, 102, 119],
    [1, 2, 3, 4, 5, 6, 7],
    [-15, -30, -45, -60, -75, -90, -105],
    [-16, -32, -48, -64, -80, -96, -112],
    [-17, -34, -51, -68, -85, -102, -119],
    [-1, -2, -3, -4, -5, -6, -7]
]

function zobrist_piece_square(piece_index: number, square: number) {
    let x = (piece_index * 1315423911) ^ (square * 2654435761)
    x ^= (x << 13)
    x ^= (x >> 17)
    x ^= (x << 5)
    return x
}

function compute_pawn_score(board: Array<number>, side: number, my_pawn_structure: NumPointer, opp_pawn_structure: NumPointer, pawn_score: NumPointer) {
    pawn_score[0] = 0

    if (!(my_pawn_structure[0] & 0x1c0000)) pawn_score[0] -= ISOLATION_PENALTY * ((my_pawn_structure[0] >> 21) & 7)
    if (!(my_pawn_structure[0] & 0xe38000)) pawn_score[0] -= ISOLATION_PENALTY * ((my_pawn_structure[0] >> 18) & 7)
    if (!(my_pawn_structure[0] & 0x1c7000)) pawn_score[0] -= ISOLATION_PENALTY * ((my_pawn_structure[0] >> 15) & 7)
    if (!(my_pawn_structure[0] & 0x038e00)) pawn_score[0] -= ISOLATION_PENALTY * ((my_pawn_structure[0] >> 12) & 7)
    if (!(my_pawn_structure[0] & 0x0071C0)) pawn_score[0] -= ISOLATION_PENALTY * ((my_pawn_structure[0] >> 9) & 7);
    if (!(my_pawn_structure[0] & 0x000E38)) pawn_score[0] -= ISOLATION_PENALTY * ((my_pawn_structure[0] >> 6) & 7);
    if (!(my_pawn_structure[0] & 0x0001C7)) pawn_score[0] -= ISOLATION_PENALTY * ((my_pawn_structure[0] >> 3) & 7);
    if (!(my_pawn_structure[0] & 0x000038)) pawn_score[0] -= ISOLATION_PENALTY * (my_pawn_structure[0] & 7);
    
    pawn_score[0] -= doubled_penalty[(my_pawn_structure[0] >> 21) & 7];
    pawn_score[0] -= doubled_penalty[(my_pawn_structure[0] >> 18) & 7];
    pawn_score[0] -= doubled_penalty[(my_pawn_structure[0] >> 15) & 7];
    pawn_score[0] -= doubled_penalty[(my_pawn_structure[0] >> 12) & 7];
    pawn_score[0] -= doubled_penalty[(my_pawn_structure[0] >> 9) & 7];
    pawn_score[0] -= doubled_penalty[(my_pawn_structure[0] >> 6) & 7];
    pawn_score[0] -= doubled_penalty[(my_pawn_structure[0] >> 3) & 7];
    pawn_score[0] -= doubled_penalty[my_pawn_structure[0] & 7];

    if (!(opp_pawn_structure[0] & 0xFC0000)) pawn_score[0] += PASSED_REWARD * ((my_pawn_structure[0] >> 21) & 7);
    if (!(opp_pawn_structure[0] & 0xFF8000)) pawn_score[0] += PASSED_REWARD * ((my_pawn_structure[0] >> 18) & 7);
    if (!(opp_pawn_structure[0] & 0x1FF000)) pawn_score[0] += PASSED_REWARD * ((my_pawn_structure[0] >> 15) & 7);
    if (!(opp_pawn_structure[0] & 0x03FE00)) pawn_score[0] += PASSED_REWARD * ((my_pawn_structure[0] >> 12) & 7);
    if (!(opp_pawn_structure[0] & 0x007FC0)) pawn_score[0] += PASSED_REWARD * ((my_pawn_structure[0] >> 9) & 7);
    if (!(opp_pawn_structure[0] & 0x000FF8)) pawn_score[0] += PASSED_REWARD * ((my_pawn_structure[0] >> 6) & 7);
    if (!(opp_pawn_structure[0] & 0x0001FF)) pawn_score[0] += PASSED_REWARD * ((my_pawn_structure[0] >> 3) & 7);
    if (!(opp_pawn_structure[0] & 0x00003F)) pawn_score[0] += PASSED_REWARD * (my_pawn_structure[0] & 7);
}

function make_move(board: Array<number>, game_data: ExtraGameInfo, move: NumPointer, undo: Undo, update_eval: number) {
    let origin = DECODE_FROM(move[0])
    let dest = DECODE_DEST(move[0])
    let side_is_white = (game_data.side_to_move == WHITE)
    let from_pst = side_is_white ? TO_6BIT(origin) : TO_6BIT_C(origin)
    let to_pst = side_is_white ? TO_6BIT(dest) : TO_6BIT_C(dest)
    let pawn_struct_updated = 0
    let piece_type = Math.abs(board[origin])
    let mg_delta = 0
    let eg_delta = 0
    undo.move = move[0]
    undo.captured = board[dest];
    undo.castling = game_data.castling;
    undo.ep_square = game_data.ep_square;
    undo.halfmove_clock = game_data.halfmove_clock;
    undo.fullmove_clock = game_data.fullmove_clock;
    undo.side_to_move = game_data.side_to_move;
    undo.black_king_sq = game_data.black_king_sq;
    undo.white_king_sq = game_data.white_king_sq;
    undo.black_pawn_struct = game_data.black_pawn_struct;
    undo.white_pawn_struct = game_data.white_pawn_struct;
    undo.black_pawn_score = game_data.black_pawn_score;
    undo.white_pawn_score = game_data.white_pawn_score;
    undo.black_king_safety = game_data.black_king_safety;
    undo.white_king_safety = game_data.white_king_safety;
    undo.phase = game_data.phase;
    undo.mg_eval = game_data.mg_eval;
    undo.eg_modifier = game_data.eg_modifier;
    undo.hash = game_data.hash;
    
    switch (piece_type) {
        case WK:
            game_data.castling &= ~(3 << (1 + game_data.side_to_move))
            if (side_is_white) {
                game_data.white_king_sq = dest
            } else {
                game_data.black_king_sq = dest
            }
            break
        case WR:
            if (origin == 0x70)
                game_data.castling &= ~4
            else if (origin == 0x77)
                game_data.castling &= ~8
            else if (origin == 0x00)
                game_data.castling &= ~1
            else if (origin == 0x07)
                game_data.castling &= ~2
            break
        case WP:
            game_data.halfmove_clock = -1
            break
    }

    if (Math.abs(undo.captured) == WR) {
        if (dest == 0x70)
            game_data.castling &= ~4
        else if (dest == 0x77)
            game_data.castling &= ~8
        else if (dest == 0x00)
            game_data.castling &= ~1
        else if (dest == 0x07)
            game_data.castling &= ~2
    }

    // # 548 COMMENTED if (game_data->castling ^ undo->castling) {
    game_data.hash ^= ZOBRIST_CASTLE(undo.castling)
    game_data.hash ^= ZOBRIST_CASTLE(game_data.castling)

    switch (move[0] >> 12) {
        case FLAG_CASTLE_S:
            board[origin + 2] = board[origin]
            board[origin + 1] = board[origin + 3]
            board[origin] = EMPTY
            board[origin + 3] = EMPTY

            if (update_eval) {
                mg_delta -= mg_king_table[from_pst]
                mg_delta += mg_king_table[to_pst]

                eg_delta -= eg_king_table[from_pst]
                eg_delta += eg_king_table[to_pst]

                mg_delta -= rook_table[side_is_white ? TO_6BIT(origin + 3) : TO_6BIT_C(origin + 3)]
                mg_delta += rook_table[side_is_white ? TO_6BIT(origin + 1) : TO_6BIT_C(origin + 1)]

                eg_delta -= rook_table[side_is_white ? TO_6BIT(origin + 3) : TO_6BIT_C(origin + 3)]
                eg_delta += rook_table[side_is_white ? TO_6BIT(origin + 1) : TO_6BIT_C(origin + 1)]
            }

            game_data.hash ^= zobrist_piece_square(ZOBRIST_PIECE_FIX(board[origin + 2]),origin)
            game_data.hash ^= zobrist_piece_square(ZOBRIST_PIECE_FIX(board[origin + 2]), origin + 2)

            game_data.hash ^= zobrist_piece_square(ZOBRIST_PIECE_FIX(board[origin + 1]), origin + 3)
            game_data.hash ^= zobrist_piece_square(ZOBRIST_PIECE_FIX(board[origin + 1]), origin + 1)

            break
        case FLAG_CASTLE_L:
            board[origin - 2] = board[origin]
            board[origin - 1] = board[origin - 4]
            board[origin] = EMPTY
            board[origin - 4] = EMPTY

            if (update_eval) {
                mg_delta -= mg_king_table[from_pst]
                mg_delta += mg_king_table[to_pst]

                eg_delta -= eg_king_table[from_pst]
                eg_delta += eg_king_table[to_pst]

                mg_delta -= rook_table[side_is_white ? TO_6BIT(origin - 4) : TO_6BIT_C(origin - 4)]
                mg_delta += rook_table[side_is_white ? TO_6BIT(origin - 1) : TO_6BIT_C(origin - 1)]

                eg_delta -= rook_table[side_is_white ? TO_6BIT(origin - 4) : TO_6BIT_C(origin - 4)]
                eg_delta += rook_table[side_is_white ? TO_6BIT(origin - 1) : TO_6BIT_C(origin - 1)]
            }

            game_data.hash ^= zobrist_piece_square(ZOBRIST_PIECE_FIX(board[origin - 2]), origin)
            game_data.hash ^= zobrist_piece_square(ZOBRIST_PIECE_FIX(board[origin - 2]), origin - 2)

            game_data.hash ^= zobrist_piece_square(ZOBRIST_PIECE_FIX(board[origin - 1]),origin - 4)
            game_data.hash ^= zobrist_piece_square(ZOBRIST_PIECE_FIX(board[origin - 1]), origin - 1)
            
            break
        default:
            board[dest] = board[origin]
            board[origin] = EMPTY

            if (update_eval) {
                mg_delta -= mg_table_atlas[piece_type][from_pst]
                mg_delta += mg_table_atlas[piece_type][to_pst]

                eg_delta -= eg_table_atlas[piece_type][from_pst]
                eg_delta += eg_table_atlas[piece_type][to_pst]
            }

            game_data.hash ^= zobrist_piece_square(ZOBRIST_PIECE_FIX(board[dest]), origin)
            game_data.hash ^= zobrist_piece_square(ZOBRIST_PIECE_FIX(board[dest]), dest)

            if (undo.captured) {
                game_data.halfmove_clock = -1
                if (update_eval) {
                    mg_delta += mg_table_atlas[Math.abs(undo.captured)][side_is_white ? TO_6BIT_C(dest) : TO_6BIT(dest)]
                    mg_delta += piece_values[Math.abs(undo.captured)]

                    eg_delta += eg_table_atlas[Math.abs(undo.captured)][side_is_white ? TO_6BIT_C(dest) : TO_6BIT(dest)]
                }
                if (board[dest] == WP) {
                    game_data .white_pawn_struct -= (1 << (3 * (origin & 7)))
                    game_data.white_pawn_struct += (1 << (3 * (dest & 7)))
                } else if (board[dest] == BP) {
                    game_data.black_pawn_struct -= (1 << (3 * (origin & 7)))
                    game_data.black_pawn_struct += (1 << (3 * (dest & 7)))
                }

                if (undo.captured == WP) {
                    game_data.white_pawn_struct -= (1 << (3 * (dest & 7)))
                } else if (undo.captured == BP) {
                    game_data.black_pawn_struct -= (1 << (3 * (dest & 7)))
                }
                game_data.hash ^= zobrist_piece_square(ZOBRIST_PIECE_FIX(undo.captured), dest)

                game_data.phase += phase_weight[Math.abs(undo.captured)]
            }
            break
    }

    if (((move[0]) >> 14) == 1) {
        if (update_eval) { 
            mg_delta -= mg_table_atlas[piece_type][to_pst]
            mg_delta -= piece_values[piece_type]

            eg_delta -= eg_table_atlas[piece_type][to_pst]
        }

        game_data.hash ^= zobrist_piece_square(ZOBRIST_PIECE_FIX(board[dest]), dest)

        board[dest] = SIGN(board[dest]) * (((move[0]) >> 12) - 2)
        game_data.hash ^= zobrist_piece_square(ZOBRIST_PIECE_FIX(board[dest]), dest)

        if (side_is_white) {
            game_data.white_pawn_struct -= (1 << (3 * (dest & 7)))
        } else {
            game_data.black_pawn_struct -= (1 << (3 * (dest & 7)))
        }

        game_data.phase -= phase_weight[Math.abs(board[dest])]

        if (update_eval) {
            mg_delta += mg_table_atlas[Math.abs(board[dest])][to_pst]
            mg_delta += piece_values[Math.abs(board[dest])]
            
            eg_delta += eg_table_atlas[Math.abs(board[dest])][to_pst]
        }
    }

    if (((move[0]) >> 12) == FLAG_EP) {
        if (board[game_data.ep_square] == WP) {
            game_data.white_pawn_struct -= (1 << (3 * (game_data.ep_square & 7)))
        } else if (board[game_data.ep_square] == BP) {
            game_data.black_pawn_struct -= (1 << (3 * (game_data.ep_square & 7)))
        }

        if (board[dest] == WP) {
            game_data.white_pawn_struct -= (1 << (3 * (origin & 7)))
            game_data.white_pawn_struct += (1 << (3 * (dest & 7)))
        } else if (board[dest] == BP) {
            game_data.black_pawn_struct -= (1 << (3 * (origin & 7)))
            game_data.black_pawn_struct += (1 << (3 * (dest & 7)))
        }
        game_data.hash ^= zobrist_piece_square(ZOBRIST_PIECE_FIX(board[game_data.ep_square]), game_data.ep_square)

        if (!(game_data.ep_square & 0x88)) board[game_data.ep_square] = EMPTY
        if (update_eval) {
            mg_delta += mg_pawn_table[side_is_white ? TO_6BIT_C(game_data.ep_square) : TO_6BIT(game_data.ep_square)]
            mg_delta += piece_values[WP]

            eg_delta += eg_pawn_table[side_is_white ? TO_6BIT_C(game_data.ep_square) : TO_6BIT(game_data.ep_square)]
        }
    }

    if ((undo.white_pawn_struct ^ game_data.white_pawn_struct) || (undo.black_pawn_struct ^ game_data.black_pawn_struct)) {
        // This is going to get ugly
        const _game_data_wpstruct = [game_data.white_pawn_struct]
        const _game_data_bpstruct = [game_data.black_pawn_struct]
        const _game_data_wpscore = [game_data.white_pawn_score]
        const _game_data_bpscore = [game_data.black_pawn_score]
        compute_pawn_score(board, WHITE, _game_data_wpstruct, _game_data_bpstruct, _game_data_wpscore)
        compute_pawn_score(board, BLACK, _game_data_bpstruct, _game_data_wpstruct, _game_data_bpscore)
        game_data.white_pawn_struct = _game_data_wpstruct[0]
        game_data.black_pawn_struct = _game_data_bpstruct[0]
        game_data.white_pawn_score = _game_data_wpscore[0]
        game_data.black_pawn_score = _game_data_bpscore[0]
        pawn_struct_updated = 1
    }

    if (pawn_struct_updated || Math.abs(board[dest]) == WP || Math.abs(board[dest]) == WK) {
        // # 728 compute_king_safety func is inlined because its literally only one line and it involves a pointer
        game_data.white_king_safety = 0
        game_data.black_king_safety = 0
    }

    if (((move[0]) >> 12) == FLAG_DOUBLE_STEP) {
        game_data.ep_square = dest
    } else {
        game_data.ep_square = 0x80
    }

    game_data.hash ^= ZOBRIST_EP(undo.ep_square & 7)
    game_data.hash ^= ZOBRIST_EP(game_data.ep_square & 7)

    game_data.mg_eval += (side_is_white ? mg_delta : -mg_delta)
    game_data.eg_modifier += (side_is_white ? eg_delta : -eg_delta)

    game_data.side_to_move = -(game_data.side_to_move)

    game_data.hash ^= ZOBRIST_SIDE

    game_data.halfmove_clock++
    if (!side_is_white) game_data.fullmove_clock++
}

function is_in_check(board: Array<number>, side: number, king_sq: number) {
    let i;
    let sq = 0x80

    let dir = (side == WHITE) ? -16 : 16
    let lcap = king_sq + dir - 1
    let rcap = king_sq + dir + 1

    if (king_sq & 0x88) return 0

    if (!(lcap & 0x88) && board[lcap] == (side * BP)) return 1
    if (!(rcap & 0x88) && board[rcap] == (side * BP)) return 1

    for (i = 0; i < 8; i++) {
        sq = king_sq + knight_moves[i]
        if (sq & 0x88) continue
        if (board[sq] == (side * BN)) return 1
    }

    for (i = 0; i < 8; i += 2) {
        sq = king_sq
        while (true) {
            sq += queen_moves[i];
            if (sq & 0x88) break;
            if (board[sq] == EMPTY) continue;
            if (SIGN(board[sq]) == side) break;
            if (Math.abs(board[sq]) == WR || Math.abs(board[sq]) == WQ) return 1
            break
        }
    }

    for (i = 0; i < 8; i++) {
        sq = king_sq + queen_moves[i];
        if (sq & 0x88) continue;
        if (board[sq] == (side * BK)) return 1;
    }

    return 0;
}

function single_legality_check(board: Array<number>, game_data: ExtraGameInfo, move_to_check: NumPointer, king_sq: number) {
    // # 950 Undo is initialised in original code, but TS complains about it being undefined
    // All the values are getting overwritten anyways so we just initialise it with whatever
    let u = new Undo(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)
    let return_val = 0
    make_move(board, game_data, move_to_check, u, 0)
    switch(u.move >> 12) {
        case FLAG_CASTLE_S:
            if (

            )
    }
}

// best_move_out is a ptr!
function tt_probe(tt: Array<TTEntry>, key: number, alpha: number, beta: number, depth: number, best_move_out: NumPointer) {
    const entry = tt[key & TT_MASK]

    if (entry.key == key) {
        if (best_move_out) best_move_out[0] = entry.best_move
        if (entry.depth >= depth) {
            switch (entry.flag) {
                case TT_FLAG_EXACT: return entry.score;
                case TT_FLAG_LOWER: if (entry.score >= beta) return entry.score;
                                    break;
                case TT_FLAG_UPPER: if (entry.score <= beta) return entry.score;
                                    break;
            }
        }
    } else {
        if (best_move_out) best_move_out[0] = 0
    }

    return 32767
}

function BITBOARD_QUERY(HIGH: number, LOW: number, BIT: number) {
    return ((BIT > 31) ? (HIGH >> (BIT & 31)) : (LOW >> (BIT & 31))) & 1
}

function pseudo_legal_moves(board: Array<number>, game_data: ExtraGameInfo, moves: Array<number>, use_bitboard: number, block_bitboard_high: NumPointer, block_bitboard_low: NumPointer, only_capt: number, early_return: number) {
    let i, j, k
    let m = 0
    let reverse_search = (early_return ? (game_data.side_to_move == WHITE) : (game_data.side_to_move == BLACK))
    let loop_increment = (reverse_search ? -1 : 1)
    let loop_skips = (reverse_search ? -7 : 7)
    let to
    let promote_rank, forward, ray_result
    let target
    let start_king_sq = (game_data.side_to_move == WHITE) ? game_data.white_king_sq : game_data.black_king_sq

    for (i = (reverse_search ? 127 : 0); (i < 128) && (i >= 0); i += loop_increment) {
        let i_6b = TO_6BIT(i)
        let side = SIGN(board[i])
        let piece = Math.abs(board[i])
        if (i & 0x88) {
            i += loop_skips
            continue
        }
        if (side == game_data.side_to_move) {
            switch (piece) {
                case 1:
                    promote_rank = (side == WHITE) ? 0 : 7
                    forward = (side == WHITE) ? -16 : 16

                    if (!only_capt) {
                        to = i + forward
                        if (!(to & 0x88) && board[to] == EMPTY) {
                            let single_push_bitboard = (!use_bitboard || BITBOARD_QUERY(block_bitboard_high[0], block_bitboard_low[0], TO_6BIT(to)))
                            if ((to >> 4) == promote_rank) {
                                if (single_push_bitboard) {
                                    moves[m++] = ENCODE_MOVE(FLAG_PROMO_Q, TO_6BIT(to), i_6b)
                                    if (early_return && single_legality_check(board, game_data, moves + m - 1, start_king_sq)) return m
                                }
                            }
                        }
                    }
            }
        }
    }
}

function STAND_PAT(GAMEDATA: ExtraGameInfo) {
    return (GAMEDATA.mg_eval + ((GAMEDATA.phase * GAMEDATA.eg_modifier) >> 8)) + GAMEDATA.white_pawn_score - GAMEDATA.black_pawn_score
}

function quiesce(board: Array<number>, game_data: ExtraGameInfo, alpha: number, beta: number, depth: number, side: number, metrics: Metrics, exts_applied: number) {
    let static_eval = ((side == WHITE) ? STAND_PAT(game_data) : -STAND_PAT(game_data))
    let best_value = static_eval
    let captures_count = 0
    let moves_count = 0
    let score
    let in_check
    let result
    let i
    let u
    let moves
    metrics.total_nodes++
    metrics.q_nodes++
    in_check = is_in_check(board, game_data.side_to_move, (game_data.side_to_move == WHITE) ? game_data.white_king_sq : game_data.black_king_sq)

    if (in_check) {
        best_value = -oo
    }

    if (best_value >= beta) {
        metrics.beta_cutoffs++
        return best_value
    }

    if (best_value > alpha) {
        alpha = best_value
    }

    if (depth <= 0) {
        moves_count = pseudo_legal_moves
    }
}

function minimax(
    board: Array<number>,
    game_data: ExtraGameInfo,
    tt: Array<TTEntry>,
    alpha: number,
    beta: number,
    depth: number,
    init_depth: number,
    last_pv: Array<number>,
    pv: Array<number>,
    killers: Array<Array<number>>,
    history_table: Array<Array<number>>,
    side: number,
    metrics: Metrics,
    ext_left: number,
    init_ext: number,
    debug: number,
    can_null: number
): number {
    let max: number, i: number, j: number, limit: number, score: number
    let moves_count: number
    let result: number
    let moves: Array<number>
    let best_move: number
    let u: Undo
    let child_pv: Array<number> = [0]
    // Check if it's a string or an array of nums (declared as char[])
    let status_buf
    let in_check: number, is_capture: number
    let num_ordered_moves: number
    let top_level = (depth == init_depth)
    let init_alpha = alpha
    let tt_move = 0
    let tt_score

    metrics.total_nodes++

    if (tt) {
        const _temp_tt_move = [tt_move]
        tt_score = tt_probe(tt, game_data.hash, alpha, beta, depth, _temp_tt_move)
        // Assign back
        tt_move = _temp_tt_move[0]

        if (tt_score != 32767) {
            metrics.tt_hits++
            return tt_score
        }

        if (ext_left && (depth <= init_depth - 2) && is_in_check(board, side, (side == WHITE) ? game_data.white_king_sq : game_data.black_king_sq)) {
            ext_left--
            depth++
            metrics.extensions++
        }

        if (depth <= 0) {
            metrics.horizon_nodes++
            return quiesce
        }
    }
}

export function engine(
    board: Array<number>, 
    game_data: ExtraGameInfo, 
    max_depth: number, 
    last_move: Undo, 
    history: Array<Array<number>>,
    metrics: Metrics
    ) {
    let iter_depth;
    let i;
    let engine_eval;
    let last_pv = [0]
    let pv = [0]
    let history_table = [0]
    // # 1792 TTEntry* tt = (TTEntry*)calloc(TT_SIZE, sizeof(TTEntry));
    let killers = [0]
    metrics.beta_cutoffs = 0
    metrics.extensions = 0
    metrics.final_eval = 0
    metrics.horizon_nodes = 0
    metrics.q_nodes = 0
    metrics.total_nodes = 0
    metrics.tt_hits = 0
}