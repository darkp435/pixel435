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

function DECODE_TEST(X: number) {
    return ((X & 0x0E00) >> 5) | ((X & 0x01C0) >> 6)
}

function DECODE_FROM(X: number) {
    return ((X & 56) << 1) | (X & 7)
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
        public msg_eval: number,
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
        public msg_eval: number,
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

function minimax(): number {
    
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