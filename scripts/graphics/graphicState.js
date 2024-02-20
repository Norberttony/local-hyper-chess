var pgnText = document.getElementById("pgnText");
var fenText = document.getElementById("fenText");

// Graphical state connects any graphical interfaces or inputs to the Board object.
// It does this by dispatching various events onto the main container element.
class GraphicalState {
    constructor(containerElem){
        // containerElem is used to dispatch relevant events to the main game container
        this.containerElem = containerElem;

        this.board = new Board();

        // latest board is meant to ALWAYS be the result of the current game state (when playing
        // against another player and verifying valid moves)
        this.latestBoard = new Board();

        this.positions = {};

        this.moveRoot = new PGN_Move();

        this.pgnData = new PGNData(this.moveRoot);

        // the move currently played out on the board
        this.currentMove = this.moveRoot;

        // currently user can make moves for both sides
        this.allowedSides = {
            [Piece.white]: true,
            [Piece.black]: true
        };
    }

    // where move is PGN_Move
    setMove(move){

        // go back to the first move
        while (this.previousMove()){}

        // now go forward to the given move
        for (const v of move.location){
            this.nextMove(v);
        }

        this.graphicsUpdate();
    }

    graphicsUpdate(){
        displayBoard();
        this.dispatchEvent("movescroll", {state: this, board: this.board, pgnMove: this.currentMove});
    }

    nextMove(variation = 0){
        const move = this.currentMove.next[variation];
        if (move){
            this.board.makeMove(move.move);
            this.currentMove = move;
            return true;
        }
        return false;
    }

    previousMove(){
        if (this.currentMove.prev){
            this.board.unmakeMove(this.currentMove.move);
            this.currentMove = this.currentMove.prev;
            return true;
        }
        return false;
    }

    dispatchEvent(name, detail){
        this.containerElem.dispatchEvent(new CustomEvent(name, {detail}));
    }

    // assumes move is legal
    makeMove(move){
        let SAN = getMoveSAN(this.board, move);
        
        let pgnMove;
        
        // search for an existing pgnMove
        for (const m of this.currentMove.next){
            if (m.san == SAN){
                pgnMove = m;
                break;
            }
        }
        
        // create new pgnMove
        if (!pgnMove){
            pgnMove = new PGN_Move(move);
            pgnMove.san = SAN;

            pgnMove.attachTo(this.currentMove);
        }

        this.currentMove = pgnMove;

        // if the board state is following along, update it too
        let boardIsLatest = false;
        this.board.makeMove(move);
        displayBoard(this.board, move);

        if (boardIsLatest)
            this.latestBoard.makeMove(move);

        this.dispatchEvent("madeMove", {state: this, board: this.board, san: SAN, move: move, pgnMove: pgnMove});

        // let's indicate a move scroll
        this.dispatchEvent("movescroll", {state: this, board: this.board, pgnMove: pgnMove});

        // keep track of repeated positions for three fold repetition
        let pos = this.latestBoard.getPosition();
        //if (this.positions[pos]) this.positions[pos]++;
        //else                     this.positions[pos] = 1;

        // the only issue is that this does not handle board (if moved to its latest state)
        if (this.positions[pos] >= 3)
            this.latestBoard.setResult("/", "three-fold repetition");

        // check and dispatch event for any results
        this.latestBoard.isGameOver();
        if (this.latestBoard.result)
            this.dispatchEvent("result", {state: this, board: this.latestBoard});
    }

    loadFEN(fen){
        this.positions = {};
        
        this.board.loadFEN(fen);
        this.latestBoard.loadFEN(fen);
        
        // just get rid of everything after move root and have gc handle it
        this.currentMove = this.moveRoot;
        this.moveRoot.next = [];

        displayBoard();
        this.dispatchEvent("loadedFEN", {state: this, fen});
    }

    loadPGN(pgn){
        this.positions = {};

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

        // start reading san
        let pgnSplit = pgn.split(" ");
        for (let i = 1; i < pgnSplit.length; i += 3){
            let move1 = this.board.getMoveOfSAN(pgnSplit[i]);
            if (move1) this.makeMove(move1);
            let move2 = this.board.getMoveOfSAN(pgnSplit[i + 1]);
            if (move2) this.makeMove(move2);
        }
    }

    // returns true if the given piece at this square can move, and false if it cannot
    // this depends on multiplayer rules (aka, this user cannot move any white/black pieces)
    // BUT this function will NOT ENFORCE the rules for makeMove! it's good for checking if the
    // user can make a test move given the square
    canMove(square){
        const piece = this.board.squares[square];
        
        // if user not allowed to make move for this side
        if (!this.allowedSides[this.board.turn])
            return false;
        
        // user cannot make a second test move
        if (testMove)
            return false;

        // cannot move a piece if it's not that side to play
        if (!Piece.ofColor(piece, this.board.turn))
            return false;

        // cannot move a piece if the result is determined
        if (this.board.result)
            return false;

        // otherwise we're good :)
        return true;
    }

    // determine whether current user permissions indicate spectating
    isSpectator(){
        return !(this.allowedSides[Piece.white] || this.allowedSides[Piece.black]);
    }

    setSide(side){
        this.allowedSides[Piece.white] = false;
        this.allowedSides[Piece.black] = false;

        if (side)
            this.allowedSides[side] = true;
    }
}

window.gameState = new GraphicalState(document.getElementById("container"));
