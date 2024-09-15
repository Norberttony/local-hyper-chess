
var pgnText = document.getElementById("pgnText");
var fenText = document.getElementById("fenText");

// Graphical state connects any graphical interfaces or inputs to the Board object.
// It does this by dispatching various events onto the main container element.
class GraphicalState {
    constructor(containerElem){
        // containerElem is used to dispatch relevant events to the main game container
        this.containerElem = containerElem;

        this.board = new Board();

        this.positions = {};

        this.variationRoot = new Variation();

        this.mainVariation = this.variationRoot;

        this.pgnData = new PGNData(this.variationRoot);

        // the variation currently active on the board
        this.currentVariation = this.variationRoot;

        // the variation currently displayed on screen
        this.graphicalVariation = this.currentVariation;

        // currently user can make moves for both sides
        this.allowedSides = {
            [Piece.white]: true,
            [Piece.black]: true
        };

        // whether or not the user is allowed to create new variations
        this.allowVariations = true;

        // keeps track of last capture for fifty move rule
        this.lastCapture = 0;
    }

    get turn(){
        return this.board.turn;
    }

    applyChanges(userInput = false){
        displayBoard();

        const cv = this.currentVariation;
        const gv = this.graphicalVariation;

        // no variation changes!
        if (cv == gv)
            return;
        
        // check if one of the variations follows the other
        console.log("Is prev?", cv.prev == gv || gv.prev == cv, cv, gv);
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
                attachGlyph(document.getElementById(`${toX}_${toY}`), g);
            }
        }
    }

    addMoveToEnd(san){
        const previous = this.currentVariation;

        this.jumpToVariation(this.mainVariation);
        
        const move = this.board.getMoveOfSAN(san);
        if (move)
            this.makeMove(move);

        this.jumpToVariation(previous);
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
            this.board.makeMove(variation.move);

            // position reoccurs
            this.positions[this.board.getPosition()]++;

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
            this.positions[this.board.getPosition()]--;

            this.lastCapture = this.currentVariation.fiftyMoveRuleCounter;

            this.board.unmakeMove(this.currentVariation.move);
            this.currentVariation = this.currentVariation.prev;
            return true;
        }
        return false;
    }

    // assumes move is legal
    // performs the move without making any graphical updates.
    makeMove(move){
        const SAN = getMoveSAN(this.board, move);
        
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

        this.board.makeMove(move);

        // keep track of repeated positions for three fold repetition
        let pos = this.board.getPosition();
        if (this.positions[pos]) this.positions[pos]++;
        else                     this.positions[pos] = 1;

        // the only issue is that this does not handle board (if moved to its latest state)
        if (this.positions[pos] >= 3)
            this.board.setResult("/", "three-fold repetition");

        // handle the fifty move rule
        this.lastCapture++;
        if (move.captures.length > 0){
            this.lastCapture = 0;
        }
        variation.fiftyMoveRuleCounter = this.lastCapture;
        if (this.lastCapture >= 100)
            this.board.setResult("/", "fifty move rule");

        // check and dispatch event for any results
        this.board.isGameOver();
        if (this.board.result){
            this.dispatchEvent("result", {
                result:         this.board.result,
                turn:           this.board.turn,
                termination:    this.board.termination
            });
        }
    }

    loadFEN(fen){
        this.board.loadFEN(fen);
        
        // clear the positions table
        this.positions = {};
        let pos = this.board.getPosition();
        this.positions[pos] = 1;
        
        // just get rid of everything after variation root and have gc handle it
        this.currentVariation = this.variationRoot;
        this.variationRoot.next = [];

        displayBoard();
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
        displayBoard();
    }

    // parses a list of PGN tokens
    readVariation(pgnSplit, start){

        let toUndo = 0;

        for (let i = start; i < pgnSplit.length; i++){
            const pgn = pgnSplit[i];

            if (pgn.startsWith("(")){

                this.previousVariation();

                // start a variation!
                i = this.readVariation(pgnSplit, i + 1);

                // continue with main variation
                this.nextVariation(0);

            }else if (pgn.startsWith(")")){

                for (let j = 0; j < toUndo; j++){
                    this.previousVariation();
                }

                return i;
            }else if (pgn.length == 0){
                // avoid having to search for a move that clearly doesn't exist.
                continue;
            }else{
                const move = this.board.getMoveOfSAN(pgn);
                if (move){
                    this.makeMove(move);
                    toUndo++;
                }
            }

        }
    }

    dispatchEvent(name, detail){
        this.containerElem.dispatchEvent(new CustomEvent(name, {detail}));
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

        // cannot move a piece if user is trying to make a move in the past when variations
        // aren't allowed
        if (!this.allowVariations && this.currentVariation.next.length > 0)
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
