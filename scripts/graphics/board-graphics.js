
// BoardGraphics has been created to handle the instantiation of a graphical board. The bare minimum
// that it allows is a board element with pieces displayed on it, but it can support any combination
// of widgets, that may listen to relevant state changes.

class BoardGraphics {
    constructor(allowDragging = true, displayRanksAndFiles = false, skeleton = null){
        skeleton = createSkeleton(skeleton);
        skeleton.classList.add("board-graphics--board-blue", "board-graphics--pieces-cburnett");

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
        this.widgetNames = new Set();
        this.state = new Board();
        this.allowInputFrom = { [Piece.white]: allowDragging, [Piece.black]: allowDragging };
        this.allowVariations = true;
        this.piecePointerDown = createPiecePointerDown(this);

        // threefold and draws require keeping track of repeated positions, and when the last
        // capture was performed.
        this.positions = {};
        this.lastCapture = 0;

        // variations in the position are stored via a tree. The root is the very first empty
        // variation (sentinel node).
        this.variationRoot = new Variation();

        // This set-up allows quickly adding more moves at the end of the main variation, without
        // performing any additional tree searches.
        this.mainVariation = this.variationRoot;

        // pgnData allows reading in the current variation.
        this.pgnData = new PGNData(this.variationRoot);

        // currentVariation points to the currently active variation that a piece of code or the
        // user is viewing. It is not necessarily the variation currently displayed to the user.
        this.currentVariation = this.variationRoot;

        // graphicalVariation points to the variation currently displayed to the user. If
        // currentVariation does not match with graphicalVariation, applyChanges should be called.
        this.graphicalVariation = this.currentVariation;

        // determine if meant to create files and ranks.
        if (displayRanksAndFiles)
            addFilesAndRanks(boardDiv);

        if (allowDragging){
            this.draggingElem = createBoardDraggingElem(skeleton);

            boardDiv.onpointerdown = this.piecePointerDown;

        }
    }

    get isFlipped(){
        return this.skeleton.classList.contains("board-graphics--flipped");
    }

    loading(){
        this.skeleton.classList.add("board-graphics--loading");
    }

    finishedLoading(){
        this.skeleton.classList.remove("board-graphics--loading");
    }

    // retrieves the relevant widget element, creating one if necessary
    getWidgetElem(location){
        const widgetName = WIDGET_NAMES[location];
        const elem = getFirstElemOfClass(this.skeleton, `board-graphics__${widgetName}`);
        if (elem)
            return elem;
        
        const w = document.createElement("div");
        w.classList.add(`board-graphics__${widgetName}`);
        this.skeleton.appendChild(w);
        return w;
    }

    setNames(whiteName, blackName){
        this.dispatchEvent("player-names", { whiteName, blackName });
    }

    // =========================== //
    // === LOADING FEN AND PGN === //
    // =========================== //

    loadFEN(fen){
        this.state.loadFEN(fen);
        
        // clear the positions table
        this.positions = {};
        let pos = this.state.getPosition();
        this.positions[pos] = 1;
        
        // just get rid of everything after variation root and have gc handle it
        this.currentVariation = this.variationRoot;
        this.mainVariation = this.currentVariation;
        this.variationRoot.next = [];

        this.applyChanges(false);
        this.graphicalVariation = this.variationRoot;
        this.dispatchEvent("loadFEN", { fen });
    }

    loadPGN(pgn){
        // check if we have to load from position
        let fen = StartingFEN;
        const headers = extractHeaders(pgn);
        if (headers.Variant == "From Position"){
            fen = headers.FEN;
        }
        this.loadFEN(fen);

        // remove headers
        pgn = pgn.replace(/\[.+?\]\s*/g, "");

        // remove any comments
        pgn = pgn.replace(/\{.+?\}\s*/g, "");

        // remove full move counters
        pgn = pgn.replace(/[0-9]+[\.]+/g, "");

        // add a space before and after parentheses
        pgn = pgn.replace(/\(/g, " ( ").replace(/\)/g, " ) ");

        // make sure there is one space between each move
        pgn = pgn.replace(/\s+/g, " ");
        pgn = pgn.trim();

        // start reading san
        let pgnSplit = pgn.split(" ");
        this.readVariation(pgnSplit, 0);
        this.applyChanges(false);
        this.graphicalVariation = this.variationRoot;
    }

    // =========================== //
    // === HANDLING VARIATIONS === //
    // =========================== //

    applyChanges(userInput = false){
        this.display();

        const cv = this.currentVariation;
        const gv = this.graphicalVariation;

        // no variation changes!
        if (cv == gv)
            return;
        
        // check if one of the variations follows the other
        if (cv.prev == gv || gv.prev == cv)
            this.dispatchEvent("single-scroll", { prevVariation: gv, variation: cv, userInput });
        
        this.graphicalVariation = this.currentVariation;

        this.dispatchEvent("variation-change", { variation: cv });

        // apply any relevant glyphs
        if (cv.move){
            const toX = cv.move.to % 8;
            const toY = Math.floor(cv.move.to / 8);
            
            // attach any relevant glyphs
            for (const g of cv.glyphs){
                attachGlyph(this.getPieceElem(toX, toY), g);
            }
        }
    }

    // board jumps to the given variation
    jumpToVariation(variation){
        const ca = this.currentVariation.findCommonAncestor(variation);

        // build the path of nodes from the common ancestor to the given variation
        const path = [];
        let iter = variation;
        while (iter != ca){
            path.unshift(iter.location);
            iter = iter.prev;
        }

        // go to the common ancestor
        while (this.currentVariation != ca)
            this.previousVariation();

        // go forth to the given variation
        for (const n of path)
            this.nextVariation(n);
    }

    // chooses one of the next variations to play
    nextVariation(index = 0){
        const variation = this.currentVariation.next[index];
        if (variation){
            this.state.makeMove(variation.move);

            // position reoccurs
            this.positions[this.state.getPosition()]++;

            this.lastCapture = variation.fiftyMoveRuleCounter;

            this.currentVariation = variation;
            return true;
        }
        return false;
    }

    // goes back a variation
    previousVariation(){
        if (this.currentVariation.prev){
            // position "unoccurs"
            this.positions[this.state.getPosition()]--;

            this.lastCapture = this.currentVariation.fiftyMoveRuleCounter;

            this.state.unmakeMove(this.currentVariation.move);
            this.currentVariation = this.currentVariation.prev;
            return true;
        }
        return false;
    }

    // ========================== //
    // === HANDLING MAKE MOVE === //
    // ========================== //

    // returns true if the player can move the piece at the given square. Otherwise, returns false.
    canMove(sq){
        // ensure user is not creating a variation when not allowed to.
        if (!this.allowVariations && this.currentVariation.next.length > 0)
            return false;

        const piece = this.state.squares[sq];
        const col = Piece.getColor(piece);
        return this.allowInputFrom[col] && !this.state.isImmobilized(sq, piece) && this.state.turn == col;
    }

    addMoveToEnd(san){
        const previous = this.currentVariation;
        const doSwitch = this.currentVariation != this.mainVariation;

        this.jumpToVariation(this.mainVariation);
        
        const move = this.state.getMoveOfSAN(san);
        if (move)
            this.makeMove(move);

        if (doSwitch)
            this.jumpToVariation(previous);
    }

    
    // assumes move is legal
    // performs the move without making any graphical updates. To perform graphical updates, run the
    // applyChanges method.
    makeMove(move){
        const SAN = getMoveSAN(this.state, move);
        
        // search for an existing variation with this move
        for (const v of this.currentVariation.next){
            if (v.san == SAN){
                this.nextVariation(v.location);
                return;
            }
        }
        
        // otherwise create a new variation
        const variation = new Variation(move);
        variation.san = SAN;

        variation.attachTo(this.currentVariation);

        this.currentVariation = variation;

        this.dispatchEvent("new-variation", { variation });

        // continue the main variation if necessary
        if (variation.prev == this.mainVariation)
            this.mainVariation = variation;

        this.state.makeMove(move);

        // keep track of repeated positions for three fold repetition
        let pos = this.state.getPosition();
        if (this.positions[pos]) this.positions[pos]++;
        else                     this.positions[pos] = 1;

        // the only issue is that this does not handle board (if moved to its latest state)
        if (this.positions[pos] >= 3)
            this.state.setResult("/", "three-fold repetition");

        // handle the fifty move rule
        this.lastCapture++;
        if (move.captures.length > 0){
            this.lastCapture = 0;
        }
        variation.fiftyMoveRuleCounter = this.lastCapture;
        if (this.lastCapture >= 100)
            this.state.setResult("/", "fifty move rule");

        // check and dispatch event for any results
        this.state.isGameOver();
        if (this.state.result){
            this.dispatchEvent("result", {
                result:         this.state.result,
                turn:           this.state.turn,
                termination:    this.state.termination
            });
        }
    }

    // ============================== //
    // === HANDLING BOARD DISPLAY === //
    // ============================== //

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
        this.dispatchEvent("flip");
    }

    display(){
        setAllPiecesToPool(this.skeleton);
        setAllMoveHighlightsToPool(this.skeleton);
        setAllLastMoveHighlightsToPool(this.skeleton);

        const lastMove = this.currentVariation != this.variationRoot ? this.currentVariation.move : undefined;

        // highlight move from and move to
        if (lastMove){
            const toX = lastMove.to % 8;
            const toY = Math.floor(lastMove.to / 8);
            const fromX = lastMove.from % 8;
            const fromY = Math.floor(lastMove.from / 8);
            
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

    getPieceElem(f, r){
        return this.piecesDiv.getElementsByClassName(`${f}_${r}`)[0];
    }

    // allows this object to be garbage collected.
    // do not use the object after running this method.
    // only run this method if you intend to delete the BoardGraphics object entirely.
    allowGC(){
        delete this.piecePointerDown;
    }
    
    dispatchEvent(name, detail){
        this.skeleton.dispatchEvent(new CustomEvent(name, { detail }));
    }
}


// external helper functions that are separated to avoid clutter in the constructor.
// they are generally used to populate the skeleton with graphical features.

// creates a graphical skeleton that is meant to contain a chess board's graphics and widgets.
function createSkeleton(skeleton){
    // skeleton contains all widgets including main board display
    if (!skeleton)
        skeleton = document.createElement("div");

    skeleton.classList.add("board-graphics");

    // create the main board display
    const boardDiv = document.createElement("div");
    boardDiv.classList.add("board-graphics__board");
    skeleton.appendChild(boardDiv);

    // create a loading icon
    const loadingDiv = document.createElement("div");
    loadingDiv.classList.add("board-graphics__loading");
    boardDiv.appendChild(loadingDiv);

    const loadingImg = document.createElement("img");
    loadingImg.classList.add("board-graphics__loading-img");
    loadingImg.src = "./images/pieces/immobilizer.png";
    loadingDiv.appendChild(loadingImg);

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
    return drag;
}

function createPiecePointerDown(gameState){
    return (event) => {
        setInputTarget(gameState, gameState.draggingElem, event);
    };
}
