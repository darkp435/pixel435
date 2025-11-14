// Implementation of a modified version of the game "Minesweeper"
// Creator: darkp435 (GitHub)

const container = document.getElementById("main") as HTMLElement
const flagCounter = document.getElementById("counter") as HTMLParagraphElement
const SQUARES_PER_ROW = 10
const SQUARES_PER_COLUMN = 10
const MINES = 10
const FAKE_MINES = 5
const MAGIC_SQUARES = 3

enum SquareType {
    Blank,
    Rearrange,
    Mine,
    FakeMine
}

function randint(low: number, high: number) {
    return Math.floor(Math.random() * (high - low + 1)) + low
}

class Square {
    public revealed
    constructor(public isFlagged: boolean, public type: SquareType) {
        this.revealed = false
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
        if (coord.compare(newCoord)) return true
    }

    return false
}

function vec2ToElmentId(coord: Vec2) {
    return coord.col.toString() + '-' + coord.row.toString()
}

function elmentIdToVec2(coord: string) {
    return new Vec2(parseInt(coord.split('-')[0]), parseInt(coord.split('-')[1]))
}

class Minesweeper {
    private grid: Array<Array<Square>>;
    private flags: number;
    private tilesLeft: number;
    private gameEnded: boolean;
    private fakeMines: Array<Vec2>

    constructor(firstclick: Vec2) {
        const taken: Array<Vec2> = []
        this.flags = MINES
        this.gameEnded = false

        // Generate the mines
        for (let i = 0; i < MINES; i++) {
            let index: Vec2
            do {
                index = new Vec2(randint(0, SQUARES_PER_COLUMN - 1), randint(0, SQUARES_PER_ROW - 1))
            } while (areSameCoords(taken, index) || index.compare(firstclick))

            taken.push(index)
        }

        this.fakeMines = []
        for (let i = 0; i < FAKE_MINES; i++) {
            let index: Vec2
            do {
                index = new Vec2(randint(0, SQUARES_PER_COLUMN - 1), randint(0, SQUARES_PER_ROW - 1))
            } while (areSameCoords([...taken, ...this.fakeMines], index))

            this.fakeMines.push(index)
        }

        this.tilesLeft = SQUARES_PER_COLUMN * SQUARES_PER_ROW - MINES

        this.grid = []
        for (let i = 0; i < SQUARES_PER_COLUMN; i++) {
            this.grid[i] = []
            for (let j = 0; j < SQUARES_PER_ROW; j++) {
                this.grid[i][j] = new Square(false, SquareType.Blank)
            }
        }

        for (const mine of taken) {
            console.log('REAL ' + mine.col + ', ' + mine.row) //! FOR DEVELOPMENT PURPOSES ONLY, REMOVE IN PROD!
            this.grid[mine.col][mine.row].type = SquareType.Mine
        }

        for (const fake of this.fakeMines) {
            console.log('FAKE' + fake.col + ', ' + fake.row) //! FOR DEVELOPMENT PURPOSES ONLY, REMOVE IN PROD!
            this.grid[fake.col][fake.row].type = SquareType.FakeMine
        }
    }

    // Helper function for determining nearby mines
    isMine(type: SquareType) {
        return type === SquareType.FakeMine || type === SquareType.Mine
    }

    newBtnClicked(pos: Vec2) {
        const el = this.grid[pos.col][pos.row]
        if (this.gameEnded || el.isFlagged) return
        if (el.type === SquareType.Mine) {
            document.getElementById("status")!.textContent = "You lost! You clicked on a mine."
            this.gameEnded = true
            return
        }

        const square = document.getElementById(vec2ToElmentId(pos)) as HTMLButtonElement
        el.revealed = true
        square.className = "mnsw-btn mnsw-revealed"
        this.tilesLeft--
        square.disabled = true

        let nearbyMines = 0
        // Left
        let index = pos.row - 1
        if (index > -1 && this.isMine(this.grid[pos.col][index].type)) nearbyMines++
        // Right
        index = pos.row + 1
        if (index < SQUARES_PER_ROW && this.isMine(this.grid[pos.col][index].type)) nearbyMines++
        // Top
        index = pos.col - 1
        if (index > -1 && this.isMine(this.grid[index][pos.row].type)) nearbyMines++
        // Bottom
        index = pos.col + 1
        if (index < SQUARES_PER_COLUMN && this.isMine(this.grid[index][pos.row].type)) nearbyMines++
        // Top left, index is now X
        index = pos.row - 1
        let indexY = pos.col - 1
        if (index > -1 && indexY > -1 && this.isMine(this.grid[indexY][index].type)) nearbyMines++
        // Top right
        index = pos.row + 1
        indexY = pos.col - 1
        if (index < SQUARES_PER_ROW && indexY > -1 && this.isMine(this.grid[indexY][index].type)) nearbyMines++
        // Bottom left
        index = pos.row - 1
        indexY = pos.col + 1
        if (index > -1 && indexY < SQUARES_PER_COLUMN && this.isMine(this.grid[indexY][index].type)) nearbyMines++
        // Bottom right
        index = pos.row + 1
        indexY = pos.col + 1
        if (index < SQUARES_PER_ROW && indexY < SQUARES_PER_COLUMN && this.isMine(this.grid[indexY][index].type)) nearbyMines++

        square.textContent = nearbyMines === 0 ? "" : nearbyMines.toString()
        if (nearbyMines === 0) {
            for (const fake of this.fakeMines) {

            }
        } else {
            square.textContent = nearbyMines.toString()
        }

        if (this.tilesLeft === 0) {
            document.getElementById("status")!.textContent = "You won! Congratulations."
            this.gameEnded = true
        }
    }

    getFlags() {
        return this.flags;
    }

    private useFlag(pos: Vec2) {
        if (this.flags === 0) return;
        this.flags--;
        this.grid[pos.col][pos.row].isFlagged = true;
        const el = document.getElementById(vec2ToElmentId(pos)) as HTMLButtonElement
        el.textContent = "F";
        el.classList.add("mnsw-flagged")
        flagCounter.textContent = `Flags left: ${this.flags}`
    }

    private removeFlag(pos: Vec2) {
        this.grid[pos.col][pos.row].isFlagged = false
        const el = document.getElementById(vec2ToElmentId(pos)) as HTMLButtonElement
        el.textContent = ""
        el.classList.remove("mnsw-flagged")
        this.flags++;
        flagCounter.textContent = `Flags left: ${this.flags}`
    }

    toggleFlag(pos: Vec2): void {
        if (this.grid[pos.col][pos.row].revealed || this.gameEnded) return
        if (this.grid[pos.col][pos.row].isFlagged) {
            this.removeFlag(pos)
        } else {
            this.useFlag(pos)
        }
    }
}

interface OnBtnClick {
    (id: string, rightClick?: boolean): void
    game?: Minesweeper
}

const onBtnClick: OnBtnClick = (id: string, rightClick?: boolean) => {
    if (!rightClick) {
        if (onBtnClick.game === undefined) {
            const col = parseInt(id.split('-')[0])
            const row = parseInt(id.split('-')[1])
            const initCoords = new Vec2(col, row)
            onBtnClick.game = new Minesweeper(initCoords)
            flagCounter.textContent = `Flags left: ${onBtnClick.game.getFlags()}`
            onBtnClick.game.newBtnClicked(elmentIdToVec2(id))
        } else {
            onBtnClick.game.newBtnClicked(elmentIdToVec2(id))
        }
    } else {
        onBtnClick.game?.toggleFlag(elmentIdToVec2(id))
    }
}

onBtnClick.game = undefined

for (let i = 0; i < SQUARES_PER_COLUMN; i++) {
    for (let j = 0; j < SQUARES_PER_ROW; j++) {
        const square = document.createElement('button');
        square.id = i.toString() + '-' + j.toString();
        square.className = 'mnsw-btn';
        square.addEventListener('click', (ev) => {
            const target = ev.target as HTMLElement
            onBtnClick(target.id)
        })
        square.addEventListener('contextmenu', (ev) => {
            ev.preventDefault()
            const target = ev.target as HTMLElement
            onBtnClick(target.id, true)
        })
        container.appendChild(square);
    }
}
