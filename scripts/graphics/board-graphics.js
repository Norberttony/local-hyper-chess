
// BoardGraphics has been created to handle the instantiation of a graphical board. The bare minimum
// that it allows is a board element with pieces displayed on it, but it can support any combination
// of widgets, that may listen to relevant state changes.

class BoardGraphics {
    constructor(allowDragging = true, widgets = [], displayRanksAndFiles = false, skeleton = null){
        if (!skeleton)
            skeleton = createSkeleton();

        const boardDiv = skeleton.getElementsByClassName("board-graphics__board")[0];
        if (!boardDiv)
            throw new Error("Skeleton requires a unique empty div of class name board-graphics__board");
        
        const piecesDiv = document.createElement("div");
        piecesDiv.classList.add("board-graphics__pieces");
        boardDiv.appendChild(piecesDiv);

        // set attributes
        this.skeleton = skeleton;
        this.boardDiv = boardDiv;
        this.piecesDiv = piecesDiv;
        this.state = new Board();

        // determine if meant to create files and ranks.
        if (displayRanksAndFiles)
            addFilesAndRanks(boardDiv);

        for (const w of widgets)
            this.addWidget(w);

        if (allowDragging)
            createBoardDraggingElem(skeleton);
    }

    get isFlipped(){
        return this.skeleton.classList.contains("board-graphics--flipped");
    }

    addWidget(widget){

    }

    // if v is false: white perspective
    // if v is true: black perspective
    setFlip(v){
        if (v != this.isFlipped)
            this.flip();
    }

    // flips the board and then redisplays it
    flip(){
        this.skeleton.classList.toggle("board-graphics--flipped");
        this.display();
    }

    display(){
        setAllPiecesToPool(this.skeleton);
        setAllMoveHighlightsToPool(this.skeleton);
        setAllLastMoveHighlightsToPool(this.skeleton);

        // highlight move from and move to
        if (this.lastMove){
            const toX = this.lastMove.to % 8;
            const toY = Math.floor(this.lastMove.to / 8);
            const fromX = this.lastMove.from % 8;
            const fromY = Math.floor(this.lastMove.from / 8);
            
            const sq1 = getLastMoveHighlightFromPool(toX, toY, this.isFlipped);
            const sq2 = getLastMoveHighlightFromPool(fromX, fromY, this.isFlipped);
            this.piecesDiv.appendChild(sq1);
            this.piecesDiv.appendChild(sq2);
        }

        // display all pieces on the board
        for (let r = 0; r < 8; r++){
            for (let f = 0; f < 8; f++){
                const v = this.state.squares[r * 8 + f];
                if (v){
                    const piece = getPieceFromPool(f, r, this.isFlipped, Piece.getType(v), Piece.getColor(v));
                    this.piecesDiv.appendChild(piece);
                }
            }
        }

    }
}


// external helper functions that are separated to avoid clutter in the constructor.
// they are generally used to populate the skeleton with graphical features.

// creates a graphical skeleton that is meant to contain a chess board's graphics and widgets.
function createSkeleton(){
    // skeleton contains all widgets including main board display
    const skeleton = document.createElement("div");

    // to-do: allow choosing theme and piece styles
    skeleton.classList.add("board-graphics board-graphics--board-blue board-graphics--pieces-cburnett");

    // create the main board display
    const boardDiv = document.createElement("div");
    boardDiv.classList.add("board-graphics__board");
    skeleton.appendChild(boardDiv);

    return skeleton;
}

function addFilesAndRanks(boardDiv){
    const filesDiv = document.createElement("div");
    filesDiv.classList.add("board-graphics__files");
    for (const c of "abcdefgh"){
        const file = document.createElement("div");
        file.innerText = c;
        filesDiv.appendChild(file);
    }
    boardDiv.appendChild(filesDiv);

    const ranksDiv = document.createElement("div");
    ranksDiv.classList.add("board-graphics__ranks");
    for (let r = 1; r <= 8; r++){
        const rank = document.createElement("div");
        rank.innerText = r;
        ranksDiv.appendChild(rank);
    }
    boardDiv.appendChild(ranksDiv);
}

function createBoardDraggingElem(skeleton){
    const drag = document.createElement("div");
    drag.classList.add("board-graphics__dragging");
    skeleton.appendChild(drag);
}
