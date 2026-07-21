// Originally written in C by Frank, modified to strip out graphics to be used as an engine.
// This does mean that parts of the file that utilises C++ features are written by darkp435.
//
// Notes:
// - This program was originally written in C89 intended to run on a CASIO calculator, by
//   Frank. If you notice odd-looking code, it is probably because of this. Refactoring it
//   doesn't really yield any practical benefits and would be a waste a effort, so it's
//   unadvised to do so.
// - This is now intended to be ran as WebAssembly. Do not use any OS-dependent APIs. Setting
//   Intellisense mode to clang-x64 is highly recommended for development. See
//   BUILD-INSTRUCTIONS.md at the root directory of this project for compilation instructions.
// - The original program featured a halfmove clock, but it has been removed in this program
//   due to the extra hassle and not yielding much benefit.
// - The ELO of this chess engine is approximately 1800, though it has not been benchmarked.
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <cstddef>
#include <string>

#define EMPTY 0
#define WP 1
#define WN 2
#define WB 3
#define WR 4
#define WQ 5
#define WK 6
#define BP -1
#define BN -2
#define BB -3
#define BR -4
#define BQ -5
#define BK -6
#define WHITE 1
#define BLACK -1
#define FLAG_NONE 0
#define FLAG_PROMO_N 4
#define FLAG_PROMO_B 5
#define FLAG_PROMO_R 6
#define FLAG_PROMO_Q 7
#define FLAG_DOUBLE_STEP 8
#define FLAG_CASTLE_S 9
#define FLAG_CASTLE_L 10
#define FLAG_EP 12
#define MAX_MOVES 256
#define MAX_Q_MOVES 128
#define MAX_DEPTH 6
#define MAX_Q_DEPTH 6
#define MAX_EXT 3
#define MAX_EFFECTIVE_DEPTH 9
#define NULL_MOVE_R 2
#define NULL_MOVE_THRESHOLD 3
#define LATE_MOVE_DEPTH_CUTOFF 2
#define LATE_MOVE_THRESHOLD 4
#define DELTA_MARGIN 200 
#define oo 32767
#define MATE 32000
#define PHASE_MAXIMUM 256
#define ISOLATION_PENALTY 15
#define PASSED_REWARD 50
#define SAFETY_BONUS 10
#define OPEN_FILE_KING_PENALTY 20
#define ORDER_LIMIT 6

#define SIGN(X) ((X > 0) - (X < 0))
#define TO_6BIT(X) (sq_tbl[X])
#define TO_6BIT_C(X) (sq_tbl_c[X])
#define ENCODE_MOVE(SF, T, F) ((SF << 12) | (T << 6) | F)
#define IS_SLIDER(X) ((1U << X) & 56U)
#define DECODE_DEST(X) (((X & 0x0E00) >> 5) | ((X & 0x01C0) >> 6))
#define DECODE_FROM(X) (((X & 56) << 1) | (X & 7))
#define BITBOARD_ON(HIGH, LOW, BIT) do {if (BIT > 31) HIGH |= (1U << (BIT & 31)); else LOW |= (1U << (BIT & 31));} while(0)
#define BITBOARD_QUERY(HIGH, LOW, BIT) (((BIT > 31) ? (HIGH >> (BIT & 31)) : (LOW >> (BIT & 31))) & 1)
#define ARRAY_SWAP(ARRAY, INDEX_A, INDEX_B, TEMP) do {TEMP = ARRAY[INDEX_A]; ARRAY[INDEX_A] = ARRAY[INDEX_B]; ARRAY[INDEX_B] = TEMP;} while(0)
#define ZOBRIST_PIECE_FIX(PIECE) (PIECE > 0 ? PIECE - 1 : -PIECE - 1 + 6)
// I am NOT fixing this dumpster fire - darkp435
#define MOVE_SCORE(MOVE, PIECE, CAPTURED, DEST, HISTORY, PRIORITY, K1, K2, K3) ( \
    (MOVE == PRIORITY) ? 30000 : \
    ( \
        ((CAPTURED) ? MVV_LVA[abs(CAPTURED)][abs(PIECE)] + 20000 : \
            (MOVE == K1) ? 10000 : (MOVE == K2) ? 9500 : (MOVE == K3) ? 9000 : (HISTORY ? HISTORY[ZOBRIST_PIECE_FIX(PIECE)][DEST] : 0) \
        ) + \
        (((MOVE >> 14) == 1) ? PROMOTION_VALUES[(MOVE >> 12) & 3] : 0) \
    ) \
)
#define HISTORY_MAX 8192
#define HISTORY_MAX_SHIFT 13
#define HISTORY_DECAY_SHIFT 14
#define TT_SIZE 1024
#define TT_MASK 1023
#define KILLERS_COUNT 3
#define HISTORY_STACK_SIZE 16
#define TT_FLAG_EXACT 0
#define TT_FLAG_LOWER 1
#define TT_FLAG_UPPER 2
#define MOVES_TAB 0
#define ENGINE_TAB 1
#define DEBUG_TAB 2
#define ZOBRIST_SIDE 0x9e3779b9u
#define ZOBRIST_CASTLE(rights) (rights * 0x85ebca6bu)
#define ZOBRIST_EP(ep_square) ((ep_square + 1) * 0xc2b2ae35u)

using Piece = char;
using Move = unsigned short;
using Square = unsigned char;
using HalfBitboard = unsigned long;
using Zobrist = unsigned long;

constexpr char ranks[] = "87654321";
constexpr char files[] = "abcdefgh";
constexpr char piece_names[] = " PNBRQK";

typedef struct {
    unsigned char castling; // KQkq 1 = can 0 = can't
    Square ep_square; // 64 if there is no en passant, otherwise square of the vul pawn
    char side_to_move; // 1 or -1
    Square white_king_sq;
    Square black_king_sq;
    unsigned long white_pawn_struct; // 24 bits for pawn structure
    unsigned long black_pawn_struct;
    short white_pawn_score;
    short black_pawn_score;
    short phase; // Represents weight of the endgame modifier, starts at 0 and goes to 256
    short mg_eval;
    short eg_modifier;
    Zobrist hash;
} ExtraGameInfo;

typedef struct {
    Move move; // 2B
    char captured;
    unsigned char castling;
    Square ep_square; // 0x80 if no enpassant, otherwise square of vulnerable pawn
    unsigned char halfmove_clock;
    char side_to_move;
    Square white_king_sq;
    Square black_king_sq;
    unsigned long white_pawn_struct; // 24 bits for pawn structure
    unsigned long black_pawn_struct;
    short white_pawn_score;
    short black_pawn_score;
    short phase;
    short mg_eval;
    short eg_modifier;
    Zobrist hash;
} Undo; // Size: 33 bytes

#pragma region Offset calculations
// ------------------------------ WebAssembly Helper ------------------------------
// These are functions not part of the chess engine and wrote by a different person
// than the person who wrote this chess engine. It contains the helper function
// get_offset to return necessary padding for the TS/JS side of WebAssembly.

// The real ExtraGameInfo struct contains a bunch of stuff that can be evaluated
// by the engine() function, and exposing it would be unnecessary and very annoying
// for the TS side, so we instead expect this to be passed.
struct IExtraGameInfo {
    unsigned char castling;
    unsigned char ep_square;
    unsigned char white_king_sq;
    unsigned char black_king_sq;
};

#define UNDO_OFFSETOF(x) offsetof(Undo, x)
#define EGI_OFFSETOF(x) offsetof(IExtraGameInfo, x)

struct Entry {
    std::string_view name;
    size_t bytes;
};

constexpr Entry EGIOffsets[] = {
    {"TOTAL_SIZE", sizeof(ExtraGameInfo)},
    {"castling", EGI_OFFSETOF(castling)},
    {"ep_square", EGI_OFFSETOF(ep_square)},
    {"black_king_sq", EGI_OFFSETOF(black_king_sq)},
    {"white_king_sq", EGI_OFFSETOF(white_king_sq)},
    {"_null", 0}
};

size_t lookup(const Entry table[], std::string_view member) {
    char index = 0;
    Entry entry = table[index];
    while (entry.name != "_null") {
        if (entry.name == member) return entry.bytes;
        index++;
        entry = table[index];
    }
    return static_cast<size_t>(-1);
}

/**
 * Returns the offset of a class member.
 * @param class_name The name of the C struct the member is queried from. It can either be Undo, Metrics, or ExtraGameInfo.
 * @param member The member that you wish to get the offset of.
 * @returns Offset, in bytes, of the member. If the member is not valid, returns -1 casted to size_t.
 */
extern "C" size_t get_offset(const char* member) {
    return lookup(EGIOffsets, member);
}

// Back to C89 we go, lads!
#pragma endregion

#pragma region Chess Engine

typedef struct {
    Zobrist key; // 4B
    short score; // 2B
    Move best_move; // 2B
    char depth;
    char flag;
} TTEntry; // 10 bytes

typedef unsigned short Texture;

constexpr Square sq_tbl[128] = {    
    0,  1,  2,  3,  4,  5,  6,  7,  0,  0,  0,  0,  0,  0,  0,  0,
    8,  9,  10, 11, 12, 13, 14, 15, 0,  0,  0,  0,  0,  0,  0,  0,
    16, 17, 18, 19, 20, 21, 22, 23, 0,  0,  0,  0,  0,  0,  0,  0,
    24, 25, 26, 27, 28, 29, 30, 31, 0,  0,  0,  0,  0,  0,  0,  0,
    32, 33, 34, 35, 36, 37, 38, 39, 0,  0,  0,  0,  0,  0,  0,  0,
    40, 41, 42, 43, 44, 45, 46, 47, 0,  0,  0,  0,  0,  0,  0,  0,
    48, 49, 50, 51, 52, 53, 54, 55, 0,  0,  0,  0,  0,  0,  0,  0,
    56, 57, 58, 59, 60, 61, 62, 63, 0,  0,  0,  0,  0,  0,  0,  0
};

constexpr Square sq_tbl_c[128] = {
    56, 57, 58, 59, 60, 61, 62, 63, 0,  0,  0,  0,  0,  0,  0,  0,
    48, 49, 50, 51, 52, 53, 54, 55, 0,  0,  0,  0,  0,  0,  0,  0,
    40, 41, 42, 43, 44, 45, 46, 47, 0,  0,  0,  0,  0,  0,  0,  0,
    32, 33, 34, 35, 36, 37, 38, 39, 0,  0,  0,  0,  0,  0,  0,  0,
    24, 25, 26, 27, 28, 29, 30, 31, 0,  0,  0,  0,  0,  0,  0,  0,
    16, 17, 18, 19, 20, 21, 22, 23, 0,  0,  0,  0,  0,  0,  0,  0,
    8,  9,  10, 11, 12, 13, 14, 15, 0,  0,  0,  0,  0,  0,  0,  0,
    0,  1,  2,  3,  4,  5,  6,  7,  0,  0,  0,  0,  0,  0,  0,  0
};

constexpr char mg_pawn_table[64] = {
     0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
    5,  5, 10, 25, 25, 10,  5,  5,
    0,  0,  0, 20, 20,  0,  0,  0,
    5, -5,-10,  5,  5,-10, -5,  5,
    5, 10, 10,-20,-20, 20, 10,  5,
    0,  0,  0,  0,  0,  0,  0,  0
};

constexpr char eg_pawn_table[64] = {
    0,  0,  0,  0,  0,  0,  0,  0,
    30, 30, 30, 30, 30, 30, 30, 30,
    40, 40, 30, 20, 20, 30, 40, 40,
    25, 25, 20,  5,  5, 20, 25, 25,
    20, 20, 20,  0,  0, 20, 20, 20,
    5,  15, 20,  5,  5, 20, 15,  5,
    5,  0,  0, 30, 30,-10,  0,  5,
    0,  0,  0,  0,  0,  0,  0,  0
};

constexpr char knight_table[64] = {
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -50,-20,-30,-30,-30,-30,-20,-50,
};

constexpr char bishop_table[64] = {
    -20,-10,-10,-10,-10,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5, 10, 10,  5,  0,-10,
    -10,  5,  5, 10, 10,  5,  5,-10,
    -10,  0, 10, 10, 10, 10,  0,-10,
    -10, 10, 10,  0,  0, 10, 10,-10,
    -10,  5,  0,  0,  0,  0,  5,-10,
    -20,-10,-10,-10,-10,-10,-10,-20,
};

constexpr char rook_table[64] = {
     0,  0,  0,  0,  0,  0,  0,  0,
     5, 10, 10, 10, 10, 10, 10,  5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5, -5, -5,  0,  0, -5, -5, -5
};

constexpr char queen_table[64] = {
    -20,-10,-10, -5, -5,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5,  5,  5,  5,  0,-10,
    -5,  0,  5,  5,  5,  5,  0, -5,
     0,  0,  5,  5,  5,  5,  0, -5,
    -10,  5,  5,  5,  5,  5,  0,-10,
    -10,  0,  5,  0,  0,  0,  0,-10,
    -20,-10,-10, -5, -5,-10,-10,-20
};

constexpr char mg_king_table[64] = {
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -20,-30,-30,-40,-40,-30,-30,-20,
    -10,-20,-20,-20,-20,-20,-20,-10,
    20, 20,  0,  0,  0,  0, 20, 20,
    20, 30, 20,  0,  5, 10, 30, 20
};

constexpr char eg_king_table[64] = {
     10, 30, 30, 40, 40, 30, 30, 10,
     25, 40, 45, 55, 55, 45, 40, 25,
     20, 35, 60, 80, 80, 60, 35, 20,
     15, 30, 75, 95, 95, 75, 30, 15,
      0, 15, 60, 80, 80, 60, 15,  0,
    -15,  0, 40, 45, 45, 40,  0,-15,
    -50,-45,  0,  0,  0,  0,-45,-50,
    -70,-60,-50,-30,-30,-40,-60,-70
};

constexpr char null_pst[64] = {
    0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0
};

const char* mg_table_atlas[7] = {
    null_pst, mg_pawn_table, knight_table, bishop_table, rook_table, queen_table, mg_king_table
};

const char* eg_table_atlas[7] = {
    null_pst, eg_pawn_table, null_pst, null_pst, null_pst, null_pst, eg_king_table
};

constexpr short piece_values[7] = {
    0, 100, 320, 330, 500, 900, 0
};

constexpr short PROMOTION_VALUES[4] = {
    2, 3, 5, 9
};

constexpr short phase_weight[7] = {
    0, 0, 11, 11, 21, 42, 0
};

constexpr short doubled_penalty[8] = {
    0, 0, 20, 20, 20, 20, 20, 20
};

constexpr char MVV_LVA[7][7] = {
    // attacker → columns
    // victim ↓   N   P   N   B   R   Q   K
    {0, 0, 0, 0, 0, 0, 0}, // none
    {0, 9, 8, 7, 5, 1, 0}, // pawn captures ...
    {0,31,30,29,27,23,20}, // knight ...
    {0,32,31,30,28,24,21}, // bishop ...
    {0,49,48,47,45,41,40}, // rook ...
    {0,89,88,87,85,81,80}, // queen ...
    {0,0,0,0,0,0,0},       // king captures are rare
};

constexpr char knight_moves[] = {31, 33, 14, 18, -31, -33, -14, -18};
constexpr char queen_moves[] = {15, 16, 17, 1, -15, -16, -17, -1};

constexpr char queen_rays[8][7] = {
    {15, 30, 45, 60, 75, 90, 105},
    {16, 32, 48, 64, 80, 96, 112},
    {17, 34, 51, 68, 85, 102, 119},
    {1, 2, 3, 4, 5, 6, 7},
    {-15, -30, -45, -60, -75, -90, -105},
    {-16, -32, -48, -64, -80, -96, -112},
    {-17, -34, -51, -68, -85, -102, -119},
    {-1, -2, -3, -4, -5, -6, -7}
};

void compute_pawn_score(Piece board[], char side, unsigned long* my_pawn_structure, unsigned long* opp_pawn_structure, short* pawn_score) {
    *pawn_score = 0;

    // Isolation penalty
    if (!(*my_pawn_structure & 0x1C0000)) *pawn_score -= ISOLATION_PENALTY * ((*my_pawn_structure >> 21) & 7);
    if (!(*my_pawn_structure & 0xE38000)) *pawn_score -= ISOLATION_PENALTY * ((*my_pawn_structure >> 18) & 7);
    if (!(*my_pawn_structure & 0x1C7000)) *pawn_score -= ISOLATION_PENALTY * ((*my_pawn_structure >> 15) & 7);
    if (!(*my_pawn_structure & 0x038E00)) *pawn_score -= ISOLATION_PENALTY * ((*my_pawn_structure >> 12) & 7);
    if (!(*my_pawn_structure & 0x0071C0)) *pawn_score -= ISOLATION_PENALTY * ((*my_pawn_structure >> 9) & 7);
    if (!(*my_pawn_structure & 0x000E38)) *pawn_score -= ISOLATION_PENALTY * ((*my_pawn_structure >> 6) & 7);
    if (!(*my_pawn_structure & 0x0001C7)) *pawn_score -= ISOLATION_PENALTY * ((*my_pawn_structure >> 3) & 7);
    if (!(*my_pawn_structure & 0x000038)) *pawn_score -= ISOLATION_PENALTY * (*my_pawn_structure & 7);

    // Doubled penalty
    *pawn_score -= doubled_penalty[(*my_pawn_structure >> 21) & 7];
    *pawn_score -= doubled_penalty[(*my_pawn_structure >> 18) & 7];
    *pawn_score -= doubled_penalty[(*my_pawn_structure >> 15) & 7];
    *pawn_score -= doubled_penalty[(*my_pawn_structure >> 12) & 7];
    *pawn_score -= doubled_penalty[(*my_pawn_structure >> 9) & 7];
    *pawn_score -= doubled_penalty[(*my_pawn_structure >> 6) & 7];
    *pawn_score -= doubled_penalty[(*my_pawn_structure >> 3) & 7];
    *pawn_score -= doubled_penalty[*my_pawn_structure & 7];

    // Passed reward
    if (!(*opp_pawn_structure & 0xFC0000)) *pawn_score += PASSED_REWARD * ((*my_pawn_structure >> 21) & 7);
    if (!(*opp_pawn_structure & 0xFF8000)) *pawn_score += PASSED_REWARD * ((*my_pawn_structure >> 18) & 7);
    if (!(*opp_pawn_structure & 0x1FF000)) *pawn_score += PASSED_REWARD * ((*my_pawn_structure >> 15) & 7);
    if (!(*opp_pawn_structure & 0x03FE00)) *pawn_score += PASSED_REWARD * ((*my_pawn_structure >> 12) & 7);
    if (!(*opp_pawn_structure & 0x007FC0)) *pawn_score += PASSED_REWARD * ((*my_pawn_structure >> 9) & 7);
    if (!(*opp_pawn_structure & 0x000FF8)) *pawn_score += PASSED_REWARD * ((*my_pawn_structure >> 6) & 7);
    if (!(*opp_pawn_structure & 0x0001FF)) *pawn_score += PASSED_REWARD * ((*my_pawn_structure >> 3) & 7);
    if (!(*opp_pawn_structure & 0x00003F)) *pawn_score += PASSED_REWARD * (*my_pawn_structure & 7);
}

void compute_piece_hashes(Piece board[], ExtraGameInfo* game_data) {
    int i;
    game_data->phase = 256u;
    game_data->black_pawn_struct = 0ul;
    game_data->white_pawn_struct = 0ul;
    for (i = 0; i < 128; i++) {
        if (i & 0x88) {
            i += 7;
            continue;
        }
        switch (board[i]) {
            case WP:
                game_data->white_pawn_struct += (1ul << (3 * (i & 7)));
                break;
            case WN:
                game_data->phase -= phase_weight[WN];
                break;
            case WB:
                game_data->phase -= phase_weight[WB];
                break;
            case WR:
                game_data->phase -= phase_weight[WR];
                break;
            case WQ:
                game_data->phase -= phase_weight[WQ];
                break;
            case BP:
                game_data->black_pawn_struct += (1ul << (3 * (i & 7)));
                break;
            case BN:
                game_data->phase -= phase_weight[WN];
                break;
            case BB:
                game_data->phase -= phase_weight[WB];
                break;
            case BR:
                game_data->phase -= phase_weight[WR];
                break;
            case BQ:
                game_data->phase -= phase_weight[WQ];
                break;
        }
    }
}

// Lightweight 32-bit mixing hash
Zobrist zobrist_piece_square(char piece_index, char square) {
    Zobrist x = (piece_index * 1315423911u) ^ (square * 2654435761u);
    x ^= (x << 13);
    x ^= (x >> 17);
    x ^= (x << 5);
    return x;
}

Zobrist compute_hash(Piece board[], ExtraGameInfo* game_data) {
    int sq;
    Zobrist hash = 0;
    for (sq = 0; sq < 128; sq++) {
        Piece p = board[sq];
        if (sq & 0x88) {
            sq += 7;
            continue;
        }
        if (p != EMPTY) {
            int idx = ZOBRIST_PIECE_FIX(p);
            hash ^= zobrist_piece_square(idx, sq);
        }
    }

    if (game_data->side_to_move == BLACK)
        hash ^= ZOBRIST_SIDE;

    hash ^= ZOBRIST_CASTLE(game_data->castling);

    hash ^= ZOBRIST_EP(game_data->ep_square & 7);  // file only

    return hash;
}

short tt_probe(TTEntry tt[], Zobrist key, short alpha, short beta, short depth, Move* best_move_out) {
    TTEntry* entry = &tt[key & TT_MASK];

    if (entry->key == key) {
        if (best_move_out) *best_move_out = entry->best_move;
        if (entry->depth >= depth) {
            switch (entry->flag) {
                case TT_FLAG_EXACT: return entry->score;
                case TT_FLAG_LOWER: if (entry->score >= beta) return entry->score;
                                    break;
                case TT_FLAG_UPPER: if (entry->score <= alpha) return entry->score;
                                    break;
            }
        }
    } else {
        if (best_move_out) *best_move_out = 0;
    }
    return 32767; // special "no hit"
}

void tt_store(TTEntry tt[], Zobrist key, short score, short depth, char flag, Move best_move) {
    TTEntry* entry = &tt[key & TT_MASK];
    if (entry->depth <= depth) { // replace only if same or deeper
        entry->key = key;
        entry->score = score;
        entry->depth = depth;
        entry->flag = flag;
        entry->best_move = best_move;
    }
}

void make_move(Piece board[], ExtraGameInfo* game_data, Move* move, Undo* undo, int update_eval) {
    Square origin = DECODE_FROM(*move);
    Square dest = DECODE_DEST(*move);
    char side_is_white = (game_data->side_to_move == WHITE);
    char from_pst = side_is_white ? TO_6BIT(origin) : TO_6BIT_C(origin);
    char to_pst = side_is_white ? TO_6BIT(dest) : TO_6BIT_C(dest);
    char pawn_struct_updated = 0;
    Piece piece_type = abs(board[origin]);
    short mg_delta = 0; // Delta is defined as how much better the position is for the side to move
    short eg_delta = 0; // Delta is defined as how much better the position is for the side to move
    
    undo->move = *move;
    undo->captured = board[dest];
    undo->castling = game_data->castling;
    undo->ep_square = game_data->ep_square;
    undo->side_to_move = game_data->side_to_move;
    undo->black_king_sq = game_data->black_king_sq;
    undo->white_king_sq = game_data->white_king_sq;
    undo->black_pawn_struct = game_data->black_pawn_struct;
    undo->white_pawn_struct = game_data->white_pawn_struct;
    undo->black_pawn_score = game_data->black_pawn_score;
    undo->white_pawn_score = game_data->white_pawn_score;
    undo->phase = game_data->phase;
    undo->mg_eval = game_data->mg_eval;
    undo->eg_modifier = game_data->eg_modifier;
    undo->hash = game_data->hash;

    // If moving the king, remove both castling rights, and update the relevant king position
    switch (piece_type) {
        case WK:
            game_data->castling &= ~(3U << (1 + game_data->side_to_move));
            if (side_is_white) {
                game_data->white_king_sq = dest;
            } else {
                game_data->black_king_sq = dest;
            }
            break;
        case WR:
                if (origin == 0x70)  // A1
                game_data->castling &= ~4U; // White Q-side
            else if (origin == 0x77) // H1
                game_data->castling &= ~8U; // White K-side
            else if (origin == 0x00) // A8
                game_data->castling &= ~1U; // Black Q-side
            else if (origin == 0x07) // H8
                game_data->castling &= ~2U; // Black K-side
            break;
    }

    if (abs(undo->captured) == WR) {
        if (dest == 0x70)  // A1
            game_data->castling &= ~4U;
        else if (dest == 0x77) // H1
            game_data->castling &= ~8U;
        else if (dest == 0x00) // A8
            game_data->castling &= ~1U;
        else if (dest == 0x07) // H8
            game_data->castling &= ~2U;
    }

    // if (game_data->castling ^ undo->castling) {
        game_data->hash ^= ZOBRIST_CASTLE(undo->castling);
        game_data->hash ^= ZOBRIST_CASTLE(game_data->castling);
    

    switch ((*move) >> 12) {
        case FLAG_CASTLE_S:
            board[origin + 2] = board[origin];
            board[origin + 1] = board[origin + 3];
            board[origin] = EMPTY;
            board[origin + 3] = EMPTY;

            if (update_eval) {
                // Move king
                mg_delta -= mg_king_table[from_pst];
                mg_delta += mg_king_table[to_pst];

                eg_delta -= eg_king_table[from_pst];
                eg_delta += eg_king_table[to_pst];

                // Move rook
                mg_delta -= rook_table[side_is_white ? TO_6BIT(origin + 3) : TO_6BIT_C(origin + 3)];
                mg_delta += rook_table[side_is_white ? TO_6BIT(origin + 1) : TO_6BIT_C(origin + 1)];

                eg_delta -= rook_table[side_is_white ? TO_6BIT(origin + 3) : TO_6BIT_C(origin + 3)];
                eg_delta += rook_table[side_is_white ? TO_6BIT(origin + 1) : TO_6BIT_C(origin + 1)];
            }

            game_data->hash ^= zobrist_piece_square(ZOBRIST_PIECE_FIX(board[origin + 2]), origin);
            game_data->hash ^= zobrist_piece_square(ZOBRIST_PIECE_FIX(board[origin + 2]), origin + 2);

            game_data->hash ^= zobrist_piece_square(ZOBRIST_PIECE_FIX(board[origin + 1]), origin + 3);
            game_data->hash ^= zobrist_piece_square(ZOBRIST_PIECE_FIX(board[origin + 1]), origin + 1);

            break;
        case FLAG_CASTLE_L:
            board[origin - 2] = board[origin];
            board[origin - 1] = board[origin - 4];
            board[origin] = EMPTY;
            board[origin - 4] = EMPTY;

            if (update_eval) {
                // Move king
                mg_delta -= mg_king_table[from_pst];
                mg_delta += mg_king_table[to_pst];

                eg_delta -= eg_king_table[from_pst];
                eg_delta += eg_king_table[to_pst];

                // Move rook
                mg_delta -= rook_table[side_is_white ? TO_6BIT(origin - 4) : TO_6BIT_C(origin - 4)];
                mg_delta += rook_table[side_is_white ? TO_6BIT(origin - 1) : TO_6BIT_C(origin - 1)];

                eg_delta -= rook_table[side_is_white ? TO_6BIT(origin - 4) : TO_6BIT_C(origin - 4)];
                eg_delta += rook_table[side_is_white ? TO_6BIT(origin - 1) : TO_6BIT_C(origin - 1)];
            }
            
            game_data->hash ^= zobrist_piece_square(ZOBRIST_PIECE_FIX(board[origin - 2]), origin);
            game_data->hash ^= zobrist_piece_square(ZOBRIST_PIECE_FIX(board[origin - 2]), origin - 2);

            game_data->hash ^= zobrist_piece_square(ZOBRIST_PIECE_FIX(board[origin - 1]), origin - 4);
            game_data->hash ^= zobrist_piece_square(ZOBRIST_PIECE_FIX(board[origin - 1]), origin - 1);

            break;
        default:
            board[dest] = board[origin];
            board[origin] = EMPTY;

            if (update_eval) {
                // Subtract: Current pst value
                mg_delta -= mg_table_atlas[piece_type][from_pst];
                // Add: New pst value
                mg_delta += mg_table_atlas[piece_type][to_pst];

                eg_delta -= eg_table_atlas[piece_type][from_pst];
                // Add: New pst value
                eg_delta += eg_table_atlas[piece_type][to_pst];
            }

            game_data->hash ^= zobrist_piece_square(ZOBRIST_PIECE_FIX(board[dest]), origin);
            game_data->hash ^= zobrist_piece_square(ZOBRIST_PIECE_FIX(board[dest]), dest);

            // If capture:
            if (undo->captured) {
                if (update_eval) {
                    // Add victim pst (add since taking away from opponent = adding to self)
                    mg_delta += mg_table_atlas[abs(undo->captured)][side_is_white ? TO_6BIT_C(dest) : TO_6BIT(dest)]; 
                    // Add victim value 
                    mg_delta += piece_values[abs(undo->captured)];

                    // Add victim pst (add since taking away from opponent = adding to self)
                    eg_delta += eg_table_atlas[abs(undo->captured)][side_is_white ? TO_6BIT_C(dest) : TO_6BIT(dest)]; 
                    // Add victim value
                }
                if (board[dest] == WP) {
                    game_data->white_pawn_struct -= (1ul << (3 * (origin & 7)));
                    game_data->white_pawn_struct += (1ul << (3 * (dest & 7)));
                } else if (board[dest] == BP) {
                    game_data->black_pawn_struct -= (1ul << (3 * (origin & 7)));
                    game_data->black_pawn_struct += (1ul << (3 * (dest & 7)));
                }
                
                if (undo->captured == WP) {
                    game_data->white_pawn_struct -= (1ul << (3 * (dest & 7)));
                } else if (undo->captured == BP) {
                    game_data->black_pawn_struct -= (1ul << (3 * (dest & 7)));
                }
                game_data->hash ^= zobrist_piece_square(ZOBRIST_PIECE_FIX(undo->captured), dest);

                game_data->phase += phase_weight[abs(undo->captured)];
            }
            break;
    }

    if (((*move) >> 14) == 1) {
        if (update_eval) {
            mg_delta -= mg_table_atlas[piece_type][to_pst];
            mg_delta -= piece_values[piece_type];

            eg_delta -= eg_table_atlas[piece_type][to_pst];
        }

        game_data->hash ^= zobrist_piece_square(ZOBRIST_PIECE_FIX(board[dest]), dest);

        board[dest] = SIGN(board[dest]) * (((*move) >> 12) - 2);

        game_data->hash ^= zobrist_piece_square(ZOBRIST_PIECE_FIX(board[dest]), dest);

        if (side_is_white) {
            game_data->white_pawn_struct -= (1ul << (3 * (dest & 7)));
        } else {
            game_data->black_pawn_struct -= (1ul << (3 * (dest & 7)));
        }

        game_data->phase -= phase_weight[abs(board[dest])];

        if (update_eval) {
            mg_delta += mg_table_atlas[abs(board[dest])][to_pst];
            mg_delta += piece_values[abs(board[dest])];

            eg_delta += eg_table_atlas[abs(board[dest])][to_pst];
        }
    }

    // remove ep captured pawn
    if (((*move) >> 12) == FLAG_EP) {

        // remove the victim pawn
        if (board[game_data->ep_square] == WP) {
            game_data->white_pawn_struct -= (1ul << (3 * (game_data->ep_square & 7)));
        } else if (board[game_data->ep_square] == BP) {
            game_data->black_pawn_struct -= (1ul << (3 * (game_data->ep_square & 7)));
        }
        
        if (board[dest] == WP) {
            game_data->white_pawn_struct -= (1ul << (3 * (origin & 7)));
            game_data->white_pawn_struct += (1ul << (3 * (dest & 7)));
        } else if (board[dest] == BP) {
            game_data->black_pawn_struct -= (1ul << (3 * (origin & 7)));
            game_data->black_pawn_struct += (1ul << (3 * (dest & 7)));
        }
        game_data->hash ^= zobrist_piece_square(ZOBRIST_PIECE_FIX(board[game_data->ep_square]), game_data->ep_square);

        if (!(game_data->ep_square & 0x88)) board[game_data->ep_square] = EMPTY;
        if (update_eval) {
            mg_delta += mg_pawn_table[side_is_white ? TO_6BIT_C(game_data->ep_square) : TO_6BIT(game_data->ep_square)];
            mg_delta += piece_values[WP];

            eg_delta += eg_pawn_table[side_is_white ? TO_6BIT_C(game_data->ep_square) : TO_6BIT(game_data->ep_square)];
        }
    }

    if ((undo->white_pawn_struct ^ game_data->white_pawn_struct) || (undo->black_pawn_struct ^ game_data->black_pawn_struct)) {
        compute_pawn_score(board, WHITE, &game_data->white_pawn_struct, &game_data->black_pawn_struct, &game_data->white_pawn_score);
        compute_pawn_score(board, BLACK, &game_data->black_pawn_struct, &game_data->white_pawn_struct, &game_data->black_pawn_score);
        pawn_struct_updated = 1;
    }

    // set the ep flag if a pawn moved forward 2 squares
    if (((*move) >> 12) == FLAG_DOUBLE_STEP) {
        game_data->ep_square = dest;
    } else {
        game_data->ep_square = 0x80;
    }

    game_data->hash ^= ZOBRIST_EP(undo->ep_square & 7);
    game_data->hash ^= ZOBRIST_EP(game_data->ep_square & 7);

    game_data->mg_eval += (side_is_white ? mg_delta : -mg_delta);
    game_data->eg_modifier += (side_is_white ? eg_delta : -eg_delta);

    game_data->side_to_move = -(game_data->side_to_move);

    game_data->hash ^= ZOBRIST_SIDE;
}

void unmake_move(Piece board[], ExtraGameInfo* game_data, Undo* undo) {
    Square origin = DECODE_FROM(undo->move);
    Square dest = DECODE_DEST(undo->move);

    if (((undo->move) >> 12) == FLAG_CASTLE_S) {
        board[origin] = board[origin + 2];      
        board[origin + 3] = board[origin + 1];
        board[origin + 1] = EMPTY;
        board[origin + 2] = EMPTY;
    } else if ((undo->move) >> 12 == FLAG_CASTLE_L) {
        board[origin] = board[origin - 2];
        board[origin - 4] = board[origin - 1];
        board[origin - 2] = EMPTY;
        board[origin - 1] = EMPTY;
    } else {
        board[origin] = board[dest];
        board[dest] = undo->captured;
    }

    // un-promotion
    if (((undo->move) >> 14) == 1) {
        board[origin] = SIGN(board[origin]) * WP;
    }

    // un-en-passant
    if (((undo->move) >> 12) == FLAG_EP) {
        if (!(undo->ep_square & 0x88)) board[undo->ep_square] = (BP * (undo->side_to_move));
    }

    game_data->castling = undo->castling;
    game_data->ep_square = undo->ep_square;
    game_data->side_to_move = undo->side_to_move;
    game_data->white_king_sq = undo->white_king_sq;
    game_data->black_king_sq = undo->black_king_sq;
    game_data->black_pawn_struct = undo->black_pawn_struct;
    game_data->white_pawn_struct = undo->white_pawn_struct;
    game_data->black_pawn_score = undo->black_pawn_score;
    game_data->white_pawn_score = undo->white_pawn_score;
    game_data->phase = undo->phase;
    game_data->mg_eval = undo->mg_eval;
    game_data->eg_modifier = undo->eg_modifier;
    game_data->hash = undo->hash;
}

int _is_in_check(Piece board[], char side, Square king_sq) {
    int i;
    Square sq = 0x80;

    int dir = (side == WHITE) ? -16 : 16;
    int lcap = king_sq + dir - 1;
    int rcap = king_sq + dir + 1;

    if (king_sq & 0x88) return 0; // safety

    if (!(lcap & 0x88) && board[lcap] == (side * BP)) return 1;
    if (!(rcap & 0x88) && board[rcap] == (side * BP)) return 1;

    for (i = 0; i < 8; i++) {
        sq = king_sq + knight_moves[i];
        if (sq & 0x88) continue;
        if (board[sq] == (side * BN)) return 1;
    }

    for (i = 0; i < 8; i += 2) {
        sq = king_sq;
        while (1) {
            sq += queen_moves[i];
            if (sq & 0x88) break;
            if (board[sq] == EMPTY) continue;
            if (SIGN(board[sq]) == side) break;
            if (abs(board[sq]) == WB || abs(board[sq]) == WQ) return 1;
            break;
        }
    }

    for (i = 1; i < 9; i += 2) {
        sq = king_sq;
        while (1) {
            sq += queen_moves[i];
            if (sq & 0x88) break;
            if (board[sq] == EMPTY) continue;
            if (SIGN(board[sq]) == side) break;
            if (abs(board[sq]) == WR || abs(board[sq]) == WQ) return 1;
            break;
        }
    }

    for (i = 0; i < 8; i++) {
        sq = king_sq + queen_moves[i];
        if (sq & 0x88) continue;
        if (board[sq] == (side * BK)) return 1;
    }

    return 0;
}

// Tiny compatibility wrapper around the real is_in_check function (now called _is_in_check)
// king_sq is provided as 4 bits to the row and the other 4 bits to the column
extern "C" int is_in_check(Piece board[], char side, unsigned char king_sq) {
    uint8_t row = king_sq >> 4;
    printf("King row: %d\n", row);
    uint8_t col = king_sq & 0xf;
    printf("King col: %d\n", col);
    unsigned char res = col;
    res += ((7 - row) * 0x10);
    printf("%x\n", res);
    return _is_in_check(board, side, res);
}

int parse_check(Piece board[], char side, Square king_sq, HalfBitboard* block_bitboard_high, HalfBitboard* block_bitboard_low) {

    int i;
    Square sq = 0x80;

    int dir = (side == WHITE) ? -16 : 16;
    int lcap = king_sq + dir - 1;
    int rcap = king_sq + dir + 1;
    
    *block_bitboard_high = 0ul;
    *block_bitboard_low = 0ul;

    if (king_sq & 0x88) return 0; // safety

    if (!(lcap & 0x88) && board[lcap] == (side * BP)) {
        BITBOARD_ON(*block_bitboard_high, *block_bitboard_low, TO_6BIT(lcap));
        return 1;
    }
    if (!(rcap & 0x88) && board[rcap] == (side * BP)) {
        BITBOARD_ON(*block_bitboard_high, *block_bitboard_low, TO_6BIT(rcap));
        return 1;
    }

    for (i = 0; i < 8; i++) {
        sq = king_sq + knight_moves[i];
        if (sq & 0x88) continue;
        if (board[sq] == (side * BN)) {
            BITBOARD_ON(*block_bitboard_high, *block_bitboard_low, TO_6BIT(sq));
            return 1;
        }
    }

    for (i = 0; i < 8; i += 2) {
        sq = king_sq;
        while (1) {
            sq += queen_moves[i];
            if (sq & 0x88) break;
            if (board[sq] == EMPTY) continue;
            if (SIGN(board[sq]) == side) break;
            if (abs(board[sq]) == WB || abs(board[sq]) == WQ) {
                while (1) {
                    if (sq & 0x88) break;
                    if (sq == king_sq) break; 
                    BITBOARD_ON(*block_bitboard_high, *block_bitboard_low, TO_6BIT(sq));
                    sq -= queen_moves[i];
                }
                return 1;
            }
            break;
        }
    }

    // --- sliding attacks: rook/queen (orthogonals) ---
    for (i = 1; i < 9; i += 2) {
        sq = king_sq;
        while (1) {
            sq += queen_moves[i];
            if (sq & 0x88) break;
            if (board[sq] == EMPTY) continue;
            if (SIGN(board[sq]) == side) break;
            if (abs(board[sq]) == WR || abs(board[sq]) == WQ) {
                while (1) {
                    if (sq & 0x88) break;
                    if (sq == king_sq) break; 
                    BITBOARD_ON(*block_bitboard_high, *block_bitboard_low, TO_6BIT(sq));
                    sq -= queen_moves[i];
                }
                return 1;
            }
            break;
        }
    }

    for (i = 0; i < 8; i++) {
        sq = king_sq + queen_moves[i];
        if (sq & 0x88) continue;
        if (board[sq] == (side * BK)) return 1;
    }

    return 0;
}

int check_game_over(Piece board[], ExtraGameInfo* game_data, int moves_count, int in_check) {
    if (moves_count == 0) {
        if (in_check) {
            // checkmate
            return -(game_data->side_to_move);
        } else {
            return 2;
        }
    }
    if ((game_data->phase >= PHASE_MAXIMUM - phase_weight[WN]) && !(game_data->white_pawn_struct | game_data->black_pawn_struct)) return 2; // Insuf material
    return 0;
}

int single_legality_check(Piece board[], ExtraGameInfo* game_data, Move* move_to_check, Square king_sq) {
    Undo u;
    int return_val = 0;
    make_move(board, game_data, move_to_check, &u, 0);
    switch(u.move >> 12) {
        case FLAG_CASTLE_S:
            if (
                !_is_in_check(board, -(game_data->side_to_move), king_sq) &&
                !_is_in_check(board, -(game_data->side_to_move), (king_sq) - 1) &&
                !_is_in_check(board, -(game_data->side_to_move), (king_sq) - 2)
            ) {
                return_val = 1;
            }
        case FLAG_CASTLE_L:
            if (
                !_is_in_check(board, -(game_data->side_to_move), king_sq) &&
                !_is_in_check(board, -(game_data->side_to_move), (king_sq) + 1) &&
                !_is_in_check(board, -(game_data->side_to_move), (king_sq) + 2)
            ) {
                return_val = 1;
            }
            break;
        default:
            if (!_is_in_check(board, -(game_data->side_to_move), king_sq)) {
                return_val = 1;
            }
            break;
    }

    unmake_move(board, game_data, &u);

    return return_val;
}

int pseudo_legal_moves(Piece board[], ExtraGameInfo* game_data, Move moves[], int use_bitboard, HalfBitboard* block_bitboard_high, HalfBitboard* block_bitboard_low, int only_capt, int early_return) {
    int i, j, k;
    int m = 0;
    int reverse_search = (early_return ? (game_data->side_to_move == WHITE) : (game_data->side_to_move == BLACK));
    int loop_increment = (reverse_search ? -1 : 1);
    int loop_skips = (reverse_search ? -7 : 7);

    // If it's white to move, search 0-127 to maximise attacking, but if it's a short-circuit reverse to find pieces quickly

    // If it's white to move XOR it's a short circuit, reverse the order

    Square to;
    char promote_rank, forward, ray_result;
    Piece target;
    Square start_king_sq = (game_data->side_to_move == WHITE) ? game_data->white_king_sq : game_data->black_king_sq;

    // Flags:

    for (i = (reverse_search ? 127 : 0); (i < 128) && (i >= 0); i += loop_increment) {
        char i_6b = TO_6BIT(i);
        char side = SIGN(board[i]);
        Piece piece = abs(board[i]);
        if (i & 0x88) {
            i += loop_skips;
            continue;
        }
        if (side == game_data->side_to_move) {
            switch (piece) {
                case 1:
                    promote_rank = (side == WHITE) ? 0 : 7; 
                    forward = (side == WHITE) ? -16 : 16;
                    
                    // --- single push
                    if (!only_capt) {
                        to = i + forward;
                        if (!(to & 0x88) && board[to] == EMPTY) {
                            char single_push_bitboard = (!use_bitboard || BITBOARD_QUERY(*block_bitboard_high, *block_bitboard_low, TO_6BIT(to)));
                            if ((to >> 4) == promote_rank) {
                                // promotions
                                if (single_push_bitboard) { 
                                    moves[m++] = ENCODE_MOVE(FLAG_PROMO_Q, TO_6BIT(to), i_6b); // if (m >= MAX_MOVES) return;
                                    if (early_return && single_legality_check(board, game_data, moves + m - 1, start_king_sq)) return m;
                                    moves[m++] = ENCODE_MOVE(FLAG_PROMO_R, TO_6BIT(to), i_6b); // if (m >= MAX_MOVES) return;
                                    moves[m++] = ENCODE_MOVE(FLAG_PROMO_B, TO_6BIT(to), i_6b); // if (m >= MAX_MOVES) return;
                                    moves[m++] = ENCODE_MOVE(FLAG_PROMO_N, TO_6BIT(to), i_6b); // if (m >= MAX_MOVES) return;
                                }
                            } else {
                                if (single_push_bitboard) moves[m++] = ENCODE_MOVE(FLAG_NONE, TO_6BIT(to), i_6b);
                                if (early_return && single_legality_check(board, game_data, moves + m - 1, start_king_sq)) return m;

                                // --- double push ---
                                if ((i >> 4) == ((side == WHITE) ? 6 : 1)) {
                                    int to2 = to + forward;
                                    if (!(to2 & 0x88) && board[to2] == EMPTY && (!use_bitboard || BITBOARD_QUERY(*block_bitboard_high, *block_bitboard_low, TO_6BIT(to2))))
                                        moves[m++] = ENCODE_MOVE(FLAG_DOUBLE_STEP, TO_6BIT(to2), i_6b); // if (m >= MAX_MOVES) return;
                                        if (early_return && single_legality_check(board, game_data, moves + m - 1, start_king_sq)) return m;
                                }
                            }
                        }
                    }

                    for (j = -1; j < 2; j += 2) {
                        Piece target;
                        to = i + j + forward;
                        if (to & 0x88) continue;
                        if (use_bitboard && !BITBOARD_QUERY(*block_bitboard_high, *block_bitboard_low, TO_6BIT(to))) continue;

                        target = board[to];
                        if (target && ((-SIGN(target)) == side)) {
                            if ((to >> 4) == promote_rank) {
                                // promotion captures
                                moves[m++] = ENCODE_MOVE(FLAG_PROMO_Q, TO_6BIT(to), i_6b); // if (m >= MAX_MOVES) return;
                                if (early_return && single_legality_check(board, game_data, moves + m - 1, start_king_sq)) return m;
                                moves[m++] = ENCODE_MOVE(FLAG_PROMO_R, TO_6BIT(to), i_6b); // if (m >= MAX_MOVES) return;
                                moves[m++] = ENCODE_MOVE(FLAG_PROMO_B, TO_6BIT(to), i_6b); // if (m >= MAX_MOVES) return;
                                moves[m++] = ENCODE_MOVE(FLAG_PROMO_N, TO_6BIT(to), i_6b); // if (m >= MAX_MOVES) return;
                            } else {
                                moves[m++] = ENCODE_MOVE(FLAG_NONE, TO_6BIT(to), i_6b);
                                if (early_return && single_legality_check(board, game_data, moves + m - 1, start_king_sq)) return m;
                            }
                        }
                        if (
                            !(game_data->ep_square & 0x88) &&
                            ((game_data->ep_square) == (i + j)) &&
                            (
                                !use_bitboard ||
                                BITBOARD_QUERY(*block_bitboard_high, *block_bitboard_low, TO_6BIT(to)) ||
                                BITBOARD_QUERY(*block_bitboard_high, *block_bitboard_low, (TO_6BIT(to) - 8))
                            )
                        ) {
                            moves[m++] = ENCODE_MOVE(FLAG_EP, TO_6BIT(i + forward + j), i_6b); // if (m >= MAX_MOVES) return;
                            if (early_return && single_legality_check(board, game_data, moves + m - 1, start_king_sq)) return m;
                        }
                    }
                    break;
                case 2:
                    for (j = 0; j < 8; j++) {
                        Square to = i + knight_moves[j];
                        if (to & 0x88) continue;
                        if (use_bitboard && !BITBOARD_QUERY(*block_bitboard_high, *block_bitboard_low, TO_6BIT(to))) continue;
                        
                        if (SIGN(board[to]) == game_data->side_to_move) continue;

                        if (only_capt && !board[to]) continue;

                        moves[m++] = ENCODE_MOVE(FLAG_NONE, TO_6BIT(to), i_6b); // if (m >= MAX_MOVES) return;
                        if (early_return && single_legality_check(board, game_data, moves + m - 1, start_king_sq)) return m;
                    }
                    break;
                case 3:
                    for (j = 0; j < 8; j += 2) {
                        Square to = i;
                        while (1) {
                            to += queen_moves[j];
                            if (to & 0x88) break;

                            if (SIGN(board[to]) == game_data->side_to_move) break;

                            if (
                                (!use_bitboard || BITBOARD_QUERY(*block_bitboard_high, *block_bitboard_low, TO_6BIT(to))) &&
                                (!only_capt || board[to])
                            ) {
                                moves[m++] = ENCODE_MOVE(FLAG_NONE, TO_6BIT(to), i_6b); // if (m >= MAX_MOVES) return;
                                if (early_return && single_legality_check(board, game_data, moves + m - 1, start_king_sq)) return m;
                            }
                            
                            if ((-SIGN(board[to])) == game_data->side_to_move) break;
                        }
                    }
                    break;
                case 4:
                    for (j = 1; j < 9; j += 2) {
                        Square to = i;
                        while (1) {
                            to += queen_moves[j];
                            if (to & 0x88) break;

                            if (SIGN(board[to]) == game_data->side_to_move) break;

                            if (
                                (!use_bitboard || BITBOARD_QUERY(*block_bitboard_high, *block_bitboard_low, TO_6BIT(to))) &&
                                (!only_capt || board[to])
                            ) {
                                moves[m++] = ENCODE_MOVE(FLAG_NONE, TO_6BIT(to), i_6b); // if (m >= MAX_MOVES) return;
                                if (early_return && single_legality_check(board, game_data, moves + m - 1, start_king_sq)) return m;
                            }

                            if ((-SIGN(board[to])) == game_data->side_to_move) break;
                        }
                    }
                    break;
                case 5:
                    for (j = 0; j < 8; j++) {
                        Square to = i;
                        while (1) {
                            to += queen_moves[j];
                            if (to & 0x88) break;
                            if (SIGN(board[to]) == game_data->side_to_move) break;

                            if (
                                (!use_bitboard || BITBOARD_QUERY(*block_bitboard_high, *block_bitboard_low, TO_6BIT(to))) &&
                                (!only_capt || board[to])
                            ) {
                                moves[m++] = ENCODE_MOVE(FLAG_NONE, TO_6BIT(to), i_6b); // if (m >= MAX_MOVES) return;
                                if (early_return && single_legality_check(board, game_data, moves + m - 1, start_king_sq)) return m;
                            }

                            if ((-SIGN(board[to])) == game_data->side_to_move) break;
                        }
                    }
                    break;
                case 6:
                    for (j = 0; j < 8; j++) {
                        Square to = i + queen_moves[j];
                        if (to & 0x88) continue;
                        if (SIGN(board[to]) == game_data->side_to_move) continue;

                        if (only_capt && !board[to]) continue;

                        moves[m++] = ENCODE_MOVE(FLAG_NONE, TO_6BIT(to), i_6b); // if (m >= MAX_MOVES) return;
                        if (early_return && single_legality_check(board, game_data, moves + m - 1, to)) return m;
                    }
                    if (!only_capt) {
                        if (((game_data->castling >> (2 + side)) & 1) && !board[i + 1] && !board[i + 2]) {
                            moves[m++] = ENCODE_MOVE(FLAG_CASTLE_S, TO_6BIT(i + 2), i_6b); // if (m >= MAX_MOVES) return;
                            if (early_return && single_legality_check(board, game_data, moves + m - 1, i + 2)) return m;
                        }
                        if (((game_data->castling >> (1 + side)) & 1) && !board[i - 1] && !board[i - 2] && !board[i - 3]) {
                            moves[m++] = ENCODE_MOVE(FLAG_CASTLE_L, TO_6BIT(i - 2), i_6b); // if (m >= MAX_MOVES) return;
                            if (early_return && single_legality_check(board, game_data, moves + m - 1, i - 2)) return m;
                        }
                    }
                    break;
            } 
        }
    }
    return ((early_return) ? 0 : m);
}

void compute_pins(Piece board[], char side, Square* king_sq, HalfBitboard* pins_high, HalfBitboard* pins_low) {
    int dir;

    *pins_low = 0ul;
    *pins_high = 0ul;

    for (dir = 0; dir < 8; dir++) {
        Square sq = *king_sq;
        Square potential_pinned_piece = 0x80;

        while (1) {
            sq += queen_moves[dir];
            if (sq & 0x88) break;

            if (board[sq] == EMPTY) continue;

            if (SIGN(board[sq]) == side) {
                // First friendly piece found — mark it as potentially pinned
                if (potential_pinned_piece & 0x88)
                    potential_pinned_piece = sq;
                else
                    break; // Found a second friendly, can't be a pin
            } else {
                int abs_piece = abs(board[sq]);
                int diagonal = ((dir & 1) == 0); // 0,2,4,6 → diagonals with queen_moves[] ordering

                if (potential_pinned_piece & 0x88) break;
                if ((abs_piece == WQ) ||
                    (diagonal && abs_piece == WB) ||
                    (!diagonal && abs_piece == WR)) {
                    BITBOARD_ON(*pins_high, *pins_low, TO_6BIT(potential_pinned_piece));
                }
                
                break;
            }
        }
    }
}

int fully_legal_moves(Piece board[], ExtraGameInfo *game_data, Move legal[], short history_table[][64], int do_move_scoring, int only_captures, Square* highlight, HalfBitboard* highlight_bitboard_high, HalfBitboard* highlight_bitboard_low, int* in_check, int early_exit, Move priority_move, Move killer1, Move killer2, Move killer3) {
    Undo u;
    Move pseudo[MAX_MOVES];
    Square start_king_sq = (game_data->side_to_move == WHITE) ? game_data->white_king_sq : game_data->black_king_sq;
    int i, j, count = 0;
    int n;
    int highlight_bool = 0;
    int insert_limit;
    short move_scores[ORDER_LIMIT] = {0};
    short current_move_score = 0;
    Move temp_move;
    short temp_score;
    HalfBitboard block_bitboard_high = 0ul;
    HalfBitboard block_bitboard_low = 0ul;
    HalfBitboard pins_bitboard_high = 0ul;
    HalfBitboard pins_bitboard_low = 0ul;

    Square king_in_check = parse_check(board, game_data->side_to_move, start_king_sq, &block_bitboard_high, &block_bitboard_low);

    if ((highlight != NULL) && (highlight_bitboard_high != NULL) && (highlight_bitboard_low != NULL)) {  
        *highlight_bitboard_high = 0ul;
        *highlight_bitboard_low = 0ul;
        highlight_bool = 1;
    }

    if (king_in_check) {
        n = pseudo_legal_moves(board, game_data, pseudo, 3, &block_bitboard_high, &block_bitboard_low, 0, 0);
        if (in_check) *in_check = 1;
    } else {
        n = pseudo_legal_moves(board, game_data, pseudo, 0, NULL, NULL, only_captures, 0);
        if (in_check) *in_check = 0;
        compute_pins(board, game_data->side_to_move, &start_king_sq, &pins_bitboard_high, &pins_bitboard_low);
    }

    for (i = 0; i < n; i++) {
        // If the king is in check:
        // Only look for Captures, Blocks, Escapes
        Square origin = DECODE_FROM(pseudo[i]);
        Square dest = DECODE_DEST(pseudo[i]);

        char king_move = abs(board[origin]) == WK;
        Square king_sq = king_move ? dest : start_king_sq;

        insert_limit = (count < ORDER_LIMIT) ? count : ORDER_LIMIT - 1;

        if (
            !king_in_check &&
            !king_move &&
            ((pseudo[i] >> 12) != FLAG_EP) && // If it's not an enpassant,
            !BITBOARD_QUERY(pins_bitboard_high, pins_bitboard_low, (pseudo[i] & 63)) // The piece is not pinned
        ) {
            // print_test_message("F", i);
            legal[count] = pseudo[i];
            if (do_move_scoring) {
                current_move_score = MOVE_SCORE(pseudo[i], board[origin], board[dest], TO_6BIT(dest), history_table, priority_move, killer1, killer2, killer3);
                if (current_move_score > move_scores[insert_limit]) {
                    ARRAY_SWAP(legal, insert_limit, count, temp_move);
                    move_scores[insert_limit] = current_move_score;

                    for (j = insert_limit - 1; j >= 0; j--) {
                        if (move_scores[j] >= current_move_score) break;
                        ARRAY_SWAP(legal, j, j + 1, temp_move);
                        move_scores[j + 1] = move_scores[j];
                        move_scores[j] = current_move_score;
                    }
                }
            }
            if (highlight_bool) if (origin == *highlight) BITBOARD_ON(*highlight_bitboard_high, *highlight_bitboard_low, TO_6BIT(dest));
            count++;
            if (early_exit) return count;
            
        } else {
            make_move(board, game_data, &(pseudo[i]), &u, 0);
            switch(u.move >> 12) {
                case FLAG_CASTLE_S:
                    if (
                        !_is_in_check(board, -(game_data->side_to_move), king_sq) &&
                        !_is_in_check(board, -(game_data->side_to_move), (king_sq) - 1) &&
                        !_is_in_check(board, -(game_data->side_to_move), (king_sq) - 2)
                    ) {
                        legal[count] = pseudo[i];
                        if (do_move_scoring) {
                            current_move_score = MOVE_SCORE(pseudo[i], board[dest], u.captured, TO_6BIT(dest), history_table, priority_move, killer1, killer2, killer3);
                            if (current_move_score > move_scores[insert_limit]) {
                                ARRAY_SWAP(legal, insert_limit, count, temp_move);
                                move_scores[insert_limit] = current_move_score;

                                for (j = insert_limit - 1; j >= 0; j--) {
                                    if (move_scores[j] >= current_move_score) break;
                                    ARRAY_SWAP(legal, j, j + 1, temp_move);
                                    move_scores[j + 1] = move_scores[j];
                                    move_scores[j] = current_move_score;
                                }
                            }
                        }
                        if (highlight_bool) if (origin == *highlight) BITBOARD_ON(*highlight_bitboard_high, *highlight_bitboard_low, TO_6BIT(dest));
                        count++;
                    }
                    break;
                case FLAG_CASTLE_L:
                    if (
                        !_is_in_check(board, -(game_data->side_to_move), king_sq) &&
                        !_is_in_check(board, -(game_data->side_to_move), (king_sq) + 1) &&
                        !_is_in_check(board, -(game_data->side_to_move), (king_sq) + 2)
                    ) {
                        legal[count] = pseudo[i];
                        if (do_move_scoring) {
                            current_move_score = MOVE_SCORE(pseudo[i], board[dest], u.captured, TO_6BIT(dest), history_table, priority_move, killer1, killer2, killer3);
                            if (current_move_score > move_scores[insert_limit]) {
                                ARRAY_SWAP(legal, insert_limit, count, temp_move);
                                move_scores[insert_limit] = current_move_score;

                                for (j = insert_limit - 1; j >= 0; j--) {
                                    if (move_scores[j] >= current_move_score) break;
                                    ARRAY_SWAP(legal, j, j + 1, temp_move);
                                    move_scores[j + 1] = move_scores[j];
                                    move_scores[j] = current_move_score;
                                }
                            }
                        }
                        if (highlight_bool) if (origin == *highlight) BITBOARD_ON(*highlight_bitboard_high, *highlight_bitboard_low, TO_6BIT(dest));
                        count++;
                    }
                    break;
                default:
                    if (!_is_in_check(board, -(game_data->side_to_move), king_sq)) {
                        legal[count] = pseudo[i];
                        if (do_move_scoring) {
                            current_move_score = MOVE_SCORE(pseudo[i], board[dest], u.captured, TO_6BIT(dest), history_table, priority_move, killer1, killer2, killer3);
                            if (current_move_score > move_scores[insert_limit]) {
                                ARRAY_SWAP(legal, insert_limit, count, temp_move);
                                move_scores[insert_limit] = current_move_score;

                                for (j = insert_limit - 1; j >= 0; j--) {
                                    if (move_scores[j] >= current_move_score) break;
                                    ARRAY_SWAP(legal, j, j + 1, temp_move);
                                    move_scores[j + 1] = move_scores[j];
                                    move_scores[j] = current_move_score;
                                }
                            }
                        }
                        if (highlight_bool) if (origin == *highlight) BITBOARD_ON(*highlight_bitboard_high, *highlight_bitboard_low, TO_6BIT(dest));
                        count++;
                    }
                    break;
            }

            unmake_move(board, game_data, &u);

            if (early_exit && count) return count;
        }
    }

    return count;
}

int disambiguation_scan(Piece board[], Square origin, Square dest, Piece scan_piece) {
    int return_val = 0;
    int i;

    switch (abs(scan_piece)) {
        case WN:
            for (i = 0; i < 8; i++) {
                Square to = dest + knight_moves[i];
                if (to & 0x88) continue;
                if (to == origin) continue;
                if (board[to] == scan_piece) {
                    return_val |= ((origin & 7) == (to & 7)) ? 2 : 1;
                }
            }
            break;
        case WB:
            for (i = 0; i < 8; i += 2) {
                Square to = dest;
                while (1) {
                    to += queen_moves[i];
                    if (to & 0x88) break;
                    if (to == origin) break;
                    if (board[to] == EMPTY) continue;
                    if (board[to] == scan_piece) return_val |= ((origin & 7) == (to & 7)) ? 2 : 1;
                    break;
                }
            }
            break;
        case WR:
            for (i = 1; i < 9; i += 2) {
                Square to = dest;
                while (1) {
                    to += queen_moves[i];
                    if (to & 0x88) break;
                    if (to == origin) break;
                    if (board[to] == EMPTY) continue;
                    if (board[to] == scan_piece) return_val |= ((origin & 7) == (to & 7)) ? 2 : 1;
                    break;
                }
            }
            break;
        case WQ:
            for (i = 0; i < 8; i++) {
                Square to = dest;
                while (1) {
                    to += queen_moves[i];
                    if (to & 0x88) break;
                    if (to == origin) break;
                    if (board[to] == EMPTY) continue;
                    if (board[to] == scan_piece) return_val |= ((origin & 7) == (to & 7)) ? 2 : 1;
                    break;
                }
            }
            break;
    }
    return return_val;
}

short absolute_eval_mg(Piece board[], ExtraGameInfo* game_data) {
    int i, piece;
    short score = 0;
    short piece_allegiance;
    for (i = 0; i < 128; i++) {
        if (i & 0x88) {
            i += 7;
            continue;
        }
        if (!board[i]) continue;
        piece = abs(board[i]);
        piece_allegiance = SIGN(board[i]);
        score += piece_allegiance * piece_values[piece];
        score += piece_allegiance * mg_table_atlas[piece][(piece_allegiance == 1) ? TO_6BIT(i) : TO_6BIT_C(i)];
    }

    return score;
}

short absolute_eval_eg(Piece board[], ExtraGameInfo* game_data) {
    int i, piece;
    short score = 0;
    short piece_allegiance;
    for (i = 0; i < 128; i++) {
        if (i & 0x88) {
            i += 7;
            continue;
        }
        if (!board[i]) continue;
        piece = abs(board[i]);
        piece_allegiance = SIGN(board[i]);
        score += piece_allegiance * eg_table_atlas[piece][(piece_allegiance == 1) ? TO_6BIT(i) : TO_6BIT_C(i)];
    }

    return score;
}

#define STAND_PAT(GAMEDATA) ((GAMEDATA->mg_eval + ((GAMEDATA->phase * GAMEDATA->eg_modifier) >> 8)) + GAMEDATA->white_pawn_score - GAMEDATA->black_pawn_score)

short quiesce(Piece board[], ExtraGameInfo* game_data, short alpha, short beta, short depth, char side, short exts_applied) {
    short static_eval = ((side == WHITE) ? STAND_PAT(game_data) : -STAND_PAT(game_data));
    short best_value = static_eval;
    short captures_count = 0;
    short moves_count = 0;
    short score;
    int in_check;
    char result;
    int i;
    Undo u;
    Move moves[MAX_MOVES];

    in_check = _is_in_check(board, game_data->side_to_move, (game_data->side_to_move == WHITE) ? game_data->white_king_sq : game_data->black_king_sq);

    if (in_check) {
        best_value = -oo; // Do NOT allow stand pat pruning if we are in check
    }

    if (best_value >= beta) {
        return best_value;
    }
    
    if (best_value > alpha) 
        alpha = best_value;

    if (depth <= 0) {
        
        moves_count = pseudo_legal_moves(board, game_data, moves, 0, NULL, NULL, 0, 1);

        result = check_game_over(board, game_data, moves_count, in_check);
        if (result == 2) return 0;
        if (result) return (side * result * (MATE + depth + MAX_EXT - exts_applied));

        return static_eval;
    }

    captures_count = fully_legal_moves(board, game_data, moves, NULL, 1, 1, NULL, NULL, NULL, &in_check, 0, 0, 0, 0, 0);

    if (captures_count == 0) {
        moves_count = pseudo_legal_moves(board, game_data, moves, 0, NULL, NULL, 0, 1);
    }

    result = check_game_over(board, game_data, moves_count || captures_count, in_check);
    if (result == 2) return 0;
    if (result) return (result * (32000 + depth));

    if (captures_count == 0) return static_eval;
    
    for (i = 0; i < captures_count; i++) {
        if ((static_eval + piece_values[abs(board[DECODE_DEST(moves[i])])] + DELTA_MARGIN) < alpha)
            continue; // Delta pruning: If this move cannot possibly raise alpha, skip it
        make_move(board, game_data, &moves[i], &u, 1);
        score = -quiesce(board, game_data, -beta, -alpha, depth - 1, -side, exts_applied);
        if (score > best_value) {
            best_value = score;
            if (score > alpha) alpha = score;
        }
        unmake_move(board, game_data, &u);
        if (score >= beta) {
            return score;
        }
    } 

    return best_value;
}

const Move problematic_variation[] = {
    0, 0, 0, 0,
    8 * 4096 + 31 * 64 + 15,
};

short minimax(
    Piece board[],
    ExtraGameInfo* game_data,
    TTEntry tt[],
    short alpha,
    short beta,
    short depth,
    short init_depth,
    Move last_pv[],
    Move pv[],
    Move killers[MAX_EFFECTIVE_DEPTH][KILLERS_COUNT],
    short history_table[][64],
    char side,
    short ext_left,
    short init_ext,
    int debug,
    char can_null
) {
    short max, i, j, limit, score;
    short moves_count;
    char result;
    Move moves[MAX_MOVES];
    Move best_move;
    Undo u;
    Move child_pv[MAX_DEPTH] = {0};
    char status_buf[16];
    int in_check, is_capture;
    int num_ordered_moves;
    char top_level = (depth == init_depth);
    int init_alpha = alpha;

    Move tt_move = 0;
    short tt_score;
    
    if (tt) {
        tt_score = tt_probe(tt, game_data->hash, alpha, beta, depth, &tt_move);
        
        if (tt_score != 32767) {
            return tt_score;
        }
    }

    if (ext_left && (depth <= init_depth - 2) && _is_in_check(board, side, (side == WHITE) ? game_data->white_king_sq : game_data->black_king_sq)) {
        ext_left--;
        depth++;
    }

    if (depth <= 0) {
        return quiesce(board, game_data, alpha, beta, init_depth, side, init_ext - ext_left); // TODO: Test if depth=init_depth or depth=6 is better
    }

    moves_count = fully_legal_moves(board, game_data, moves, history_table, 1, 0, NULL, NULL, NULL, &in_check, 0, (last_pv) ? last_pv[MAX_DEPTH - depth] : (tt_move ? tt_move : 0), killers ? killers[init_depth - depth - ext_left + init_ext][0] : 0, killers ? killers[init_depth - depth - ext_left + init_ext][1] : 0, killers ? killers[init_depth - depth - ext_left + init_ext][2] : 0);
    result = check_game_over(board, game_data, moves_count, in_check);
    if (result == 2) return 0;
    if (result) return (side * result * (MATE + depth + MAX_Q_DEPTH + MAX_EXT - init_ext + ext_left));

    num_ordered_moves = (moves_count < LATE_MOVE_THRESHOLD) ? moves_count : LATE_MOVE_THRESHOLD;

    if (ext_left && (depth != init_depth) && (moves_count == 1)) {
        ext_left--;
        depth++;
    } // Forced move extension: Extend if there's only one legal move (negligible node cost)

    if (can_null && depth >= NULL_MOVE_THRESHOLD && game_data->phase < PHASE_MAXIMUM && !in_check) {
        game_data->side_to_move = -(game_data->side_to_move);
        game_data->hash ^= ZOBRIST_SIDE;

        u.ep_square = game_data->ep_square;
        game_data->ep_square = 0x80; // Clear en-passant when making a null move

        score = -minimax(board, game_data, tt, -beta, -beta + 1, depth - NULL_MOVE_R, init_depth, NULL, NULL, killers, history_table, -side, ext_left, init_ext, 0, 0); // Disallow double-null-move

        game_data->side_to_move = -(game_data->side_to_move);
        game_data->hash ^= ZOBRIST_SIDE;
        game_data->ep_square = u.ep_square;
        
        if (abs(score) >= MATE && ext_left && (depth != init_depth)) {
            ext_left--;
            depth++;
        } // If NMP yields >MATE, then there is a checkmating threat, so extend

        if (score >= beta) {
            if (tt) tt_store(tt, game_data->hash, beta, depth, TT_FLAG_LOWER, 0);
            return beta;
        }
    }

    max = -oo;

    for (i = 0; i < moves_count; i++) {
        if (depth == MAX_DEPTH && ext_left == init_ext) {
            sprintf(status_buf, " %2d%s", (90 * ((i < LATE_MOVE_THRESHOLD) ? 10 * i : 10 * LATE_MOVE_THRESHOLD + (i - LATE_MOVE_THRESHOLD))) / (moves_count + 9 * num_ordered_moves) + 10, "%");
        }

        is_capture = (board[DECODE_DEST(moves[i])]);

        make_move(board, game_data, &moves[i], &u, 1);

        if (depth <= LATE_MOVE_DEPTH_CUTOFF || i < LATE_MOVE_THRESHOLD || is_capture || in_check) {
            score = -minimax(board, game_data, tt, -beta, -alpha, depth - 1, init_depth, (i == 0) ? last_pv : NULL, child_pv, killers, history_table, -side, ext_left, init_ext, 0, can_null);
        } else {
            score = -minimax(board, game_data, tt, -beta, -alpha, depth - 2, init_depth, NULL, child_pv, killers, history_table, -side, ext_left, init_ext, 0, can_null);
        }

        if (history_table) {
            short* entry = &history_table[ZOBRIST_PIECE_FIX(board[(moves[i] >> 6) & 63])][(moves[i] >> 6) & 63];
            if (score > alpha) {
                *entry += ((HISTORY_MAX - *entry) * depth) >> HISTORY_MAX_SHIFT;
            } else {
                *entry -= ((*entry) * depth) >> HISTORY_DECAY_SHIFT;
            }
        }

        if (score > max) {
            max = score;
            if (score > alpha) alpha = score;
            best_move = moves[i];
            if (pv != NULL) {
                pv[0] = moves[i];
                memcpy(pv + 1, child_pv, sizeof(Move) * (depth - 1));
            }
        }
        unmake_move(board, game_data, &u);

        // Beta cutoff
        if (score >= beta) {
            if (tt) tt_store(tt, game_data->hash, max, depth, TT_FLAG_LOWER, best_move);
            
            if (!u.captured && (moves[i] >> 14) != 1) {
                if (killers && killers[init_depth][0] != moves[i] && killers[init_depth][1] != moves[i]) {
                    killers[init_depth - depth - ext_left + init_ext][2] = killers[init_depth - depth - ext_left + init_ext][1];
                    killers[init_depth - depth - ext_left + init_ext][1] = killers[init_depth - depth - ext_left + init_ext][0];
                    killers[init_depth - depth - ext_left + init_ext][0] = moves[i];
                }

                if (history_table) {
                    short* entry = &history_table[ZOBRIST_PIECE_FIX(board[moves[i] & 63])][(moves[i] >> 6) & 63];
                    *entry += ((HISTORY_MAX - *entry) * depth * depth) >> HISTORY_MAX_SHIFT;
                }
            }

            return max;
        }
    }

    if (tt) tt_store(tt, game_data->hash, max, depth, (max <= init_alpha) ? TT_FLAG_UPPER : ((score >= beta) ? TT_FLAG_LOWER : TT_FLAG_EXACT), best_move);

    return max;
}

void init_eval(Piece board[], ExtraGameInfo* game_data) {
    // Add: Mobility bonuses, king safety bonuses, endgame criteria, open file bonuses, pawn structure bonuses
    int i, piece;
    short piece_allegiance;
    game_data->mg_eval = 0;
    game_data->eg_modifier = 0;
    for (i = 0; i < 128; i++) {
        if (i & 0x88) {
            i += 7;
            continue;
        }
        if (!board[i]) continue;
        piece = abs(board[i]);
        piece_allegiance = SIGN(board[i]);
        game_data->mg_eval += piece_allegiance * piece_values[piece];
        game_data->mg_eval += piece_allegiance * mg_table_atlas[piece][(piece_allegiance == 1) ? TO_6BIT(i) : TO_6BIT_C(i)];
        game_data->eg_modifier += piece_allegiance * eg_table_atlas[piece][(piece_allegiance == 1) ? TO_6BIT(i) : TO_6BIT_C(i)];
    }
}

void _engine(Piece board[], ExtraGameInfo* game_data, Undo* last_move) {
    int iter_depth, i;
    short engine_eval;

    Move last_pv[MAX_DEPTH] = {0};
    Move pv[MAX_DEPTH] = {0};

    short history_table[12][64] = {0};

    TTEntry* tt = (TTEntry*)calloc(TT_SIZE, sizeof(TTEntry));
    Move killers[MAX_EFFECTIVE_DEPTH][KILLERS_COUNT] = {0};
    
    engine_eval = minimax(board, game_data, tt, -oo, oo, 1, 1, NULL, pv, killers, history_table, game_data->side_to_move, 1, 1, 0, 1);
    memcpy(last_pv, pv, sizeof(Move));
    for (iter_depth = 2; iter_depth <= MAX_DEPTH; iter_depth++) {
        engine_eval = minimax(board, game_data, tt, -oo, oo, iter_depth, iter_depth, NULL, pv, killers, history_table, game_data->side_to_move, ((iter_depth + 1) >> 1), ((iter_depth + 1) >> 1), 0, 1);
        memcpy(last_pv, pv, iter_depth * sizeof(Move));
    }

    if (pv[0]) {
        make_move(board, game_data, &pv[0], last_move, 1);
    }

    free(tt);
}

#pragma endregion

// Translates TS version of castling into one compatible for chess engine.
unsigned char _encode_castling(unsigned char castling) {
    unsigned char new_rights = 0;
    constexpr int WHITE_KINGSIDE = (1 << 3);
    constexpr int WHITE_QUEENSIDE = (1 << 2);
    switch (castling & 0b00001111) {
    // Long
    case 0:
        new_rights |= (WHITE_QUEENSIDE);
        break;
    // Short
    case 1:
        new_rights |= (WHITE_KINGSIDE);
        break;
    // Both
    case 3:
        new_rights |= (WHITE_KINGSIDE);
        new_rights |= (WHITE_KINGSIDE);
        break;
    // None, new rights appended
    default:
        break;
    }

    switch (castling >> 4) {
    case 0:
        new_rights |= 1;
        break;
    case 1:
        new_rights |= (1 << 1);
        break;
    case 3:
        new_rights |= 1;
        new_rights |= (1 << 1);
    default:
        break;
    }

    return new_rights;
}

// Translates the first 4 bytes for row and the last 4 bytes for column into engine Square form
unsigned char _translate_square(unsigned char square) {
    uint8_t col = square & 0xf;
    uint8_t row = square >> 4;
    unsigned char res = col;
    res += ((7 - row) * 0x10);
    return TO_6BIT(res);
}

// Packs row and col into one integer
constexpr unsigned char _pack(unsigned char row, unsigned char col) {
    return (row << 4) | col;
}

constexpr unsigned char decode_table[64] = {
    _pack(7,0), _pack(7, 1), _pack(7, 2), _pack(7, 3), _pack(7, 4), _pack(7, 5), _pack(7, 6), _pack(7, 7),
    _pack(6,0), _pack(6, 1), _pack(6, 2), _pack(6, 3), _pack(6, 4), _pack(6, 5), _pack(6, 6), _pack(6, 7),
    _pack(5,0), _pack(5, 1), _pack(5, 2), _pack(5, 3), _pack(5, 4), _pack(5, 5), _pack(5, 6), _pack(5, 7),
    _pack(4,0), _pack(4, 1), _pack(4, 2), _pack(4, 3), _pack(4, 4), _pack(4, 5), _pack(4, 6), _pack(4, 7),
    _pack(3,0), _pack(3, 1), _pack(3, 2), _pack(3, 3), _pack(3, 4), _pack(3, 5), _pack(3, 6), _pack(3, 7),
    _pack(2,0), _pack(2, 1), _pack(2, 2), _pack(2, 3), _pack(2, 4), _pack(2, 5), _pack(2, 6), _pack(2, 7),
    _pack(1,0), _pack(1, 1), _pack(1, 2), _pack(1, 3), _pack(1, 4), _pack(1, 5), _pack(1, 6), _pack(1, 7),
    _pack(0,0), _pack(0, 1), _pack(0, 2), _pack(0, 3), _pack(0, 4), _pack(0, 5), _pack(0, 6), _pack(0, 7)
};

// Opposite of translate_square: decodes a square
// sq_tbl[0] = a8
// sq_tbl[7] = h8
#define DECODE(x) decode_table[x]

int init = false;

// First half of retval is white castling and second half is black castling
unsigned char _decode_castling(unsigned char castling) {
    constexpr unsigned char BLACK_QUEENSIDE = 1;
    constexpr unsigned char BLACK_KINGSIDE = 1 << 1;
    constexpr unsigned char WHITE_QUEENSIDE = 1 << 2;
    constexpr unsigned char WHITE_KINGSIDE = 1 << 3;
    unsigned char white = 2;
    unsigned char black = 2;

    if (castling & BLACK_KINGSIDE && castling & BLACK_QUEENSIDE) black = 3;
    else if (castling & BLACK_KINGSIDE) black = 1;
    else if (castling & BLACK_QUEENSIDE) black = 0;

    if (castling & WHITE_KINGSIDE && castling & WHITE_QUEENSIDE) white = 3;
    else if (castling & WHITE_KINGSIDE) white = 1;
    else if (castling & WHITE_QUEENSIDE) white = 0;
    return _pack(white, black);
}

// Translates some data into what the actual engine uses; moves, for example.
extern "C" void engine(Piece board[], IExtraGameInfo* game_data) {
    static ExtraGameInfo egi;
    // castling
    egi.castling = _encode_castling(game_data->castling);
    // ep_square
    if (!game_data->ep_square) egi.ep_square = 128;
    else egi.ep_square = _translate_square(game_data->ep_square);
    // side_to_move
    egi.side_to_move = -1;
    // white_king_sq
    egi.white_king_sq = _translate_square(game_data->white_king_sq);
    // black_king_sq
    egi.black_king_sq = _translate_square(game_data->black_king_sq);
    if (!init) {
        // white_pawn_struct
        egi.white_pawn_struct = 0;
        // black_pawn_struct
        egi.black_pawn_struct = 0;
        // white_pawn_score
        egi.white_pawn_score = 0;
        // black_pawn_score
        egi.black_pawn_score = 0;
        // phase
        egi.phase = 0;
        // mg_eval and eg_modifier
        init_eval(board, &egi);
    }
    init = true;
    static Undo undo;
    _engine(board, &egi, &undo);
    // 128 indicates that there is no ep square
    if (egi.ep_square == 128) game_data->ep_square = _pack(8, 8);
    else game_data->ep_square = DECODE(egi.ep_square);
    // Decode castling rights
    game_data->castling = _decode_castling(egi.castling);
}