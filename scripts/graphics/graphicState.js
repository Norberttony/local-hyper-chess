var pgnText = document.getElementById("pgnText");
var fenText = document.getElementById("fenText");

// Graphical state connects any graphical interfaces or inputs to the Board object.
// It does this by dispatching various events onto the main container element.
class GraphicalState {
    constructor(containerElem){
        // containerElem is used to dispatch relevant events to the main game container
        this.containerElem = containerElem;

        this.board = new Board();

        // latest board is meant to ALWAYS be the result of all moves played
        this.latestBoard = new Board();

        this.moves = [];
        this.currIndex = -1;

        this.positions = {};

        // currently user can make moves for both sides
        this.allowedSides = {
            [Piece.white]: true,
            [Piece.black]: true
        };
    }

    setMoveIndex(index){
        if (index > this.currIndex){
            // wow. how... neat and tidy...! and not confusing...! at all! :D
            for (; this.currIndex++ < index;){
                if (this.currIndex != -1){
                    this.board.makeMove(this.moves[this.currIndex]);
                }
            }
            this.currIndex--; // yup. might as well. heck this
        }else{
            for (; this.currIndex > index; this.currIndex--){
                if (this.currIndex != -1){
                    this.board.unmakeMove(this.moves[this.currIndex]);
                }
            }
        }
        displayBoard(gameState.board, this.currIndex > -1 ? this.moves[this.currIndex] : false);
        this.dispatchEvent("movescroll", {state: this, board: this.board, moveIndex: this.currIndex});
    }

    nextMove(){
        if (this.currIndex < this.moves.length - 1)
            this.setMoveIndex(this.currIndex + 1);
    }

    previousMove(){
        if (this.currIndex >= 0)
            this.setMoveIndex(this.currIndex - 1);
    }

    dispatchEvent(name, detail){
        this.containerElem.dispatchEvent(new CustomEvent(name, {detail}));
    }

    // assumes move is legal
    makeMove(move){
        this.moves.push(move);

        // if the board state is following along, update it too
        let boardIsLatest = false;
        if (this.moves.length - 2 == this.currIndex){
            this.currIndex++;
            this.board.makeMove(move);
            displayBoard();

            // this means that the current board follows the latest board
            boardIsLatest = true;
        }

        let SAN = getMoveSAN(this.latestBoard, move);
        this.latestBoard.makeMove(move);

        this.dispatchEvent("madeMove", {state: this, board: this.latestBoard, san: SAN, move: move});

        // if the board is latest, let's indicate a move scroll
        if (boardIsLatest)
            this.dispatchEvent("movescroll", {state: this, board: this.board, moveIndex: this.currIndex});

        // keep track of repeated positions for three fold repetition
        let pos = this.latestBoard.getPosition();
        if (this.positions[pos]) this.positions[pos]++;
        else                     this.positions[pos] = 1;

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
        this.currIndex = -1;
        this.moves = [];

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

        // currently cannot make moves unless board matches latest board
        if (this.currIndex + 1 < this.moves.length)
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
