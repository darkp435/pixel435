// TypeScript implementation of Frank's chess engine.
// It is a direct transpilation of engine.c found
// in the rootdir of this project.
// Quote of this file:
// "Don't ask me, ask past me." - Frank, the madman
// who created the chess engine

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

function DECODE_TEST(X: number) {
    return ((X & 0x0E00) >> 5) | ((X & 0x01C0) >> 6)
}

function DECODE_FROM(X: number) {
    return ((X & 56) << 1) | (X & 7)
}

class ExtraGameInfo {
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
        public msg_eval: number,
        public eg_modifier: number,
        public hash: number
    ) {}
}

class Undo {
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
        public msg_eval: number,
        public eg_modifier: number,
        public hash: number
    ) {}
}