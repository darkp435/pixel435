// Implementation of a modified version of the game "Minesweeper"
// Creator: darkp435 (GitHub)
// Quote of this file:
// "The game was hard to write, so the game should be hard for the user" - darkp435, 2025

const container = document.getElementById("main") as HTMLElement;
import { Queue } from "./queue";
const flagCounter = document.getElementById("counter") as HTMLParagraphElement;
const SQUARES_PER_ROW = 15;
const SQUARES_PER_COLUMN = 15;
const MINES = 15;
const FAKE_MINES = MINES / 2;
const MAGIC_SQUARES = 5;
/** This is in milliseconds! */
const REVEAL_DURATION = 30000;

enum SquareType {
    Blank,
    Mine,
    FakeMine,
    Magic
}

function randint(low: number, high: number) {
    return Math.floor(Math.random() * (high - low + 1)) + low;
}

class Square {
    public revealed;
    constructor(public isFlagged: boolean, public type: SquareType) {
        this.revealed = false;
    }
}

// Describes the position of a square on the grid
class Vec2 {
    constructor(public col: number, public row: number) { }
    compare(other: Vec2): boolean {
        return other.col == this.col && other.row == this.row;
    }
}

function areSameCoords(coords: Array<Vec2>, newCoord: Vec2): boolean {
    for (const coord of coords) {
        if (coord.compare(newCoord)) return true;
    }

    return false;
}

function vec2ToElmentId(coord: Vec2) {
    return coord.col.toString() + '-' + coord.row.toString();
}

function elmentIdToVec2(coord: string) {
    return new Vec2(parseInt(coord.split('-')[0]), parseInt(coord.split('-')[1]));
}

class Minesweeper {
    private grid: Array<Array<Square>>;
    private flags: number;
    private tilesLeft: number;
    private gameEnded: boolean;
    private fakeMines: Array<Vec2>;
    private mines: Array<Vec2>;

    constructor(firstclick: Vec2) {
        const taken: Array<Vec2> = [];
        this.flags = MINES;
        this.gameEnded = false;

        // Generate the mines
        for (let i = 0; i < MINES; i++) {
            let index: Vec2;
            do {
                index = new Vec2(randint(0, SQUARES_PER_COLUMN - 1), randint(0, SQUARES_PER_ROW - 1));
            } while (areSameCoords(taken, index) || index.compare(firstclick));

            // console.log('REAL: ' + index.col + ', ' + index.row)
            taken.push(index);
        }

        this.mines = taken;
        this.fakeMines = [];
        for (let i = 0; i < FAKE_MINES; i++) {
            let index: Vec2;
            do {
                index = new Vec2(randint(0, SQUARES_PER_COLUMN - 1), randint(0, SQUARES_PER_ROW - 1));
            } while (areSameCoords([...taken, ...this.fakeMines], index));

            // console.log('FAKE: ' + index.col + ', ' + index.row)
            this.fakeMines.push(index);
        }

        const magicSquares: Array<Vec2> = [];
        for (let i = 0; i < MAGIC_SQUARES; i++) {
            let index: Vec2;
            do {
                index = new Vec2(randint(0, SQUARES_PER_COLUMN - 1), randint(0, SQUARES_PER_ROW - 1));
            } while (areSameCoords([...taken, ...this.fakeMines, ...magicSquares], index));

            // console.log('MAGIC: ' + index.col + ', ' + index.row)
            magicSquares.push(index);
        }

        this.tilesLeft = SQUARES_PER_COLUMN * SQUARES_PER_ROW - MINES;

        this.grid = [];
        for (let i = 0; i < SQUARES_PER_COLUMN; i++) {
            this.grid[i] = [];
            for (let j = 0; j < SQUARES_PER_ROW; j++) {
                this.grid[i][j] = new Square(false, SquareType.Blank);
            }
        }

        for (const mine of taken) {
            this.grid[mine.col][mine.row].type = SquareType.Mine;
        }

        for (const fake of this.fakeMines) {
            this.grid[fake.col][fake.row].type = SquareType.FakeMine;
        }

        for (const magic of magicSquares) {
            this.grid[magic.col][magic.row].type = SquareType.Magic;
        }
    }

    // Helper function for determining nearby mines
    isMine(type: SquareType) {
        return type === SquareType.FakeMine || type === SquareType.Mine;
    }

    getNumMines(pos: Vec2): number {
        let nearbyMines = 0;
        // Left
        let index = pos.row - 1;
        if (index > -1 && this.isMine(this.grid[pos.col][index].type)) nearbyMines++;
        // Right
        index = pos.row + 1;
        if (index < SQUARES_PER_ROW && this.isMine(this.grid[pos.col][index].type)) nearbyMines++;
        // Top
        index = pos.col - 1;
        if (index > -1 && this.isMine(this.grid[index][pos.row].type)) nearbyMines++;
        // Bottom
        index = pos.col + 1;
        if (index < SQUARES_PER_COLUMN && this.isMine(this.grid[index][pos.row].type)) nearbyMines++;
        // Top left, index is now X
        index = pos.row - 1;
        let indexY = pos.col - 1;
        if (index > -1 && indexY > -1 && this.isMine(this.grid[indexY][index].type)) nearbyMines++;
        // Top right
        index = pos.row + 1;
        indexY = pos.col - 1;
        if (index < SQUARES_PER_ROW && indexY > -1 && this.isMine(this.grid[indexY][index].type)) nearbyMines++;
        // Bottom left
        index = pos.row - 1;
        indexY = pos.col + 1;
        if (index > -1 && indexY < SQUARES_PER_COLUMN && this.isMine(this.grid[indexY][index].type)) nearbyMines++;
        // Bottom right
        index = pos.row + 1;
        indexY = pos.col + 1;
        if (index < SQUARES_PER_ROW && indexY < SQUARES_PER_COLUMN && this.isMine(this.grid[indexY][index].type)) nearbyMines++;

        return nearbyMines;
    }

    newBtnClicked(position: Vec2) {
        const queue = [];
        queue.push(position);
        let isFromClick = true;

        while (queue.length !== 0) {
            const pos: Vec2 = queue.shift()!;
            // pos will never be undefined due to while loop check, this is just to get the 
            // compiler to shut up about undefined value.
            // Bounds checking 
            const column = this.grid[pos.col];
            if (column === undefined) continue;
            const el = column[pos.row];
            // Outside of grid, for flood fill
            if (el === undefined) continue;
            const square = document.getElementById(vec2ToElmentId(pos)) as HTMLButtonElement;

            if (this.gameEnded || el.isFlagged) return;
            // For flood fill
            if (el.revealed) continue;
            if (el.type === SquareType.Mine) {
                document.getElementById("status")!.textContent = "You lost! You clicked on a mine.";
                for (const mine of this.mines) {
                    document.getElementById(vec2ToElmentId(mine))!.classList.add("mnsw-lost");
                }
                this.gameEnded = true;
                document.getElementById("restart")!.style.display = 'block';
                return;
            }
            if (el.type === SquareType.Magic && !isFromClick) continue;

            if (el.type === SquareType.Magic) {
                this.shuffleMines();
                square.classList.add("mnsw-magic");
            }

            el.revealed = true;
            square.classList.add("mnsw-revealed");
            this.tilesLeft--;
            square.disabled = true;

            const nearbyMines = this.getNumMines(pos);

            square.textContent = nearbyMines === 0 ? "" : nearbyMines.toString();
            if (nearbyMines === 0) {
                let closestDistance = Infinity;
                let chosenFakeMine = this.fakeMines[0];
                for (const fake of this.fakeMines) {
                    // Manhattan distance since it's a grid
                    const distance = Math.abs(pos.row - fake.row) + Math.abs(pos.col - fake.col);
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        chosenFakeMine = fake;
                    }
                }
                // console.log(`CHOSEN FAKE: ${chosenFakeMine.col}, ${chosenFakeMine.row}`)
                // Flood fill - reveal adjacent squares
                queue.push(new Vec2(pos.col + 1, pos.row + 1));
                queue.push(new Vec2(pos.col - 1, pos.row - 1));
                queue.push(new Vec2(pos.col, pos.row + 1));
                queue.push(new Vec2(pos.col - 1, pos.row));
                queue.push(new Vec2(pos.col + 1, pos.row - 1));
                queue.push(new Vec2(pos.col - 1, pos.row + 1));
                queue.push(new Vec2(pos.col + 1, pos.row));
                queue.push(new Vec2(pos.col, pos.row - 1));

                const colDistance = -(chosenFakeMine.col - pos.col) + randint(0, 2) - 1;
                const rowDistance = (chosenFakeMine.row - pos.row) + randint(0, 2) - 1;
                if (colDistance < 0 && rowDistance < 0) {
                    square.classList.add("mnsw-btn-both-negative");
                } else {
                    square.classList.add("mnsw-btn-blank");
                }

                if (colDistance < 0) {
                    square.textContent = rowDistance.toString() + colDistance.toString() + 'i';
                } else {
                    square.textContent = rowDistance.toString() + '+' + colDistance.toString() + 'i';
                }
            } else {
                square.textContent = nearbyMines.toString();
            }

            if (this.tilesLeft === 0) {
                document.getElementById("status")!.textContent = "You won! Congratulations.";
                this.gameEnded = true;
            }

            isFromClick = false;
        }
    }

    shuffleMines() {
        // Create an array of potential shuffles to speed up randomisations
        const unrevealed: Array<Vec2> = [];
        for (const [colNum, col] of this.grid.entries()) {
            for (const [rowNum, row] of col.entries()) {
                if (!row.revealed && row.type !== SquareType.Magic && row.type !== SquareType.Mine) unrevealed.push(new Vec2(colNum, rowNum));
            }
        }

        for (const mine of this.mines) {
            if (unrevealed.length === 0) break;
            const newIndex = randint(0, unrevealed.length - 1);
            const newPos = unrevealed[newIndex];
            this.grid[mine.col][mine.row].type = SquareType.Blank;
            this.grid[newPos.col][newPos.row].type = SquareType.Mine;
            // console.log(`SHIFT MINE FROM ${mine.col}, ${mine.row} TO ${newPos.col}, ${newPos.row}`)
            // Destroy the evidence, the mines never shifted.
            mine.col = newPos.col;
            mine.row = newPos.row;
            unrevealed.splice(newIndex, 1);
        }
    }

    getFlags() {
        return this.flags;
    }

    private useFlag(pos: Vec2) {
        if (this.flags === 0) return;
        this.flags--;
        this.grid[pos.col][pos.row].isFlagged = true;
        const el = document.getElementById(vec2ToElmentId(pos)) as HTMLButtonElement;
        // el.textContent = "F";
        el.classList.add("mnsw-flagged");
        flagCounter.textContent = `Flags left: ${this.flags}`;
    }

    private removeFlag(pos: Vec2) {
        this.grid[pos.col][pos.row].isFlagged = false;
        const el = document.getElementById(vec2ToElmentId(pos)) as HTMLButtonElement;
        el.textContent = "";
        el.classList.remove("mnsw-flagged");
        this.flags++;
        flagCounter.textContent = `Flags left: ${this.flags}`;
    }

    toggleFlag(pos: Vec2): void {
        if (this.grid[pos.col][pos.row].revealed || this.gameEnded) return;
        if (this.grid[pos.col][pos.row].isFlagged) {
            this.removeFlag(pos);
        } else {
            this.useFlag(pos);
        }
    }
}

interface OnBtnClick {
    (id: string, rightClick?: boolean): void;
    game?: Minesweeper;
}

const onBtnClick: OnBtnClick = (id: string, rightClick?: boolean) => {
    if (!rightClick) {
        if (onBtnClick.game === undefined) {
            const col = parseInt(id.split('-')[0]);
            const row = parseInt(id.split('-')[1]);
            const initCoords = new Vec2(col, row);
            onBtnClick.game = new Minesweeper(initCoords);
            flagCounter.textContent = `Flags left: ${onBtnClick.game.getFlags()}`;
            onBtnClick.game.newBtnClicked(elmentIdToVec2(id));
        } else {
            onBtnClick.game.newBtnClicked(elmentIdToVec2(id));
        }
    } else {
        onBtnClick.game?.toggleFlag(elmentIdToVec2(id));
    }
};

onBtnClick.game = undefined;

for (let i = 0; i < SQUARES_PER_COLUMN; i++) {
    for (let j = 0; j < SQUARES_PER_ROW; j++) {
        const square = document.createElement('button');
        square.id = i.toString() + '-' + j.toString();
        square.className = 'mnsw-btn';
        container.appendChild(square);
    }
}

document.getElementById("restart")!.onclick = () => {
    window.location.reload();
};

container.addEventListener("click", (ev) => {
    const target = ev.target as HTMLElement;
    if (!target.matches(".mnsw-btn")) return;
    onBtnClick(target.id);
});

container.addEventListener("contextmenu", (ev) => {
    const target = ev.target as HTMLElement;
    if (!target.matches(".mnsw-btn")) return;
    ev.preventDefault();
    onBtnClick(target.id, true);
});

document.getElementById("tutorial")!.onclick = () => {
    const container = document.getElementById("tut-container") as HTMLDivElement;
    if (container.style.display === "flex") {
        container.style.display = "none";
    } else {
        container.style.display = "flex";
    }
};

setInterval(() => {
    const game = onBtnClick.game;
    // Not initialised yet
    if (game === undefined) return;
}, REVEAL_DURATION);