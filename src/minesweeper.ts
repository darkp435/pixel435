const container = document.getElementById("main") as HTMLElement
const SQUARES_PER_ROW = 10
const SQUARES_PER_COLUMN = 10
const MINES = 10

enum SquareType {
    Blank,
    Rearrange,
    Mine
}

function randint(low: number, high: number) {
    return Math.floor(Math.random() * (high - low + 1)) + low
}

class Square {
    constructor(public isFlagged: boolean, public type: SquareType) { }
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

class Minesweeper {
    private grid: Array<Array<Square>>

    constructor(firstclick: Vec2) {
        const taken: Array<Vec2> = []

        // Generate the mines
        for (let i = 0; i < MINES; i++) {
            let index: Vec2
            do {
                index = new Vec2(randint(0, SQUARES_PER_COLUMN - 1), randint(0, SQUARES_PER_ROW - 1))
            } while (areSameCoords(taken, index) || index.compare(firstclick))

            taken.push(index)
        }

        this.grid = []
        for (let i = 0; i < SQUARES_PER_COLUMN; i++) {
            this.grid[i] = []
            for (let j = 0; j < SQUARES_PER_ROW; j++) {
                this.grid[i][j] = new Square(false, SquareType.Blank)
            }
        }

        for (const mine of taken) {
            console.log(mine.col + ', ' + mine.row)
            this.grid[mine.col][mine.row].type = SquareType.Mine
            const el = document.getElementById(mine.col.toString() + '-' + mine.row.toString()) as HTMLButtonElement
            el.addEventListener('click', () => { el.textContent = 'B' })
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    newBtnClicked(pos: Vec2) {

    }
}

interface OnBtnClick {
    (id: string): void
    game?: Minesweeper
}

const onBtnClick: OnBtnClick = (id: string) => {
    if (onBtnClick.game === undefined) {
        const col = parseInt(id.split('-')[0])
        const row = parseInt(id.split('-')[1])
        const initCoords = new Vec2(col, row)
        onBtnClick.game = new Minesweeper(initCoords)
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
        container.appendChild(square);
    }
}
