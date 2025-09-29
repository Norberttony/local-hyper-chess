
// the base board with no move-gen functionality. The only reason this class exists is to
// separate the move generator from generic board operations, such as checking where pieces are.

import { Piece, FENToPiece, PieceTypeToFEN } from "./piece.mjs";
import { numSquaresToEdge, dirOffsets } from "./pre-game.mjs";


export class RawBoard {
    constructor(){
        // contains the type and color of every piece on all 64 squares (Piece[Color] | Piece[Type])
        this.squares = new Uint8Array(64);

        this.pieceCounts = [ [ 0, 0, 0, 0, 0, 0, 0, 0 ], [ 0, 0, 0, 0, 0, 0, 0, 0 ] ];

        this.result;

        this.turn = Piece.white;

        // positions of kings
        this.kings = new Uint8Array(2);

        // positions of coordinators
        this.coordinators = new Uint8Array(2);

        // positions of chameleons
        this.chameleons = new Uint8Array(4);

        // fullmove counter
        this.fullmove = 1;

        // keeps track of the history of halfmoves (to allow for undoing moves)
        this.halfmoves = [];
    }

    // picks up the piece at the sq
    // returns the value of the picked up piece
    pickup(sq){
        const val = this.squares[sq];

        if (!val)
            return 0;

        this.squares[sq] = 0;

        const isWhite = Piece.ofColor(val, Piece.white);
        this.pieceCounts[isWhite ? 0 : 1][Piece.getType(val)]--;

        // update piece square look ups
        if (Piece.ofType(val, Piece.coordinator)){
            // remove coordinator from list
            this.coordinators[Piece.getColor(val) / 8 - 1] = 255;
        }else if (Piece.ofType(val, Piece.chameleon)){
            // remove chameleon from list
            if (isWhite){
                if (this.chameleons[0] == sq){
                    this.chameleons[0] = this.chameleons[1];
                    this.chameleons[1] = 255;
                }else if (this.chameleons[1] == sq)
                    this.chameleons[1] = 255;
                else{
                    console.log("white", this.getFEN(), this.chameleons);
                    throw new Error(`Tried to pick up a chameleon at square ${sq} but it was never stored in the lookup`);
                }
            }else{
                if (this.chameleons[2] == sq){
                    this.chameleons[2] = this.chameleons[3];
                    this.chameleons[3] = 255;
                }else if (this.chameleons[3] == sq)
                    this.chameleons[3] = 255;
                else{
                    console.log("black", this.getFEN(), this.chameleons);
                    throw new Error(`Tried to pick up a chameleon at square ${sq} but it was never stored in the lookup`);
                }
            }
        }else if (Piece.ofType(val, Piece.king)){
            if (isWhite){
                this.kings[0] = 255;
            }else{
                this.kings[1] = 255;
            }
        }

        return val;
    }

    // places down the given piece at the sq
    // assumes that there is currently no piece at the given sq.
    placedown(sq, piece){
        // TODO: code relies on having duplicate captures, but once that's fixed, this should
        // error.
        if (this.squares[sq])
            return;

        this.squares[sq] = piece;

        const isWhite = Piece.ofColor(piece, Piece.white);
        this.pieceCounts[isWhite ? 0 : 1][Piece.getType(piece)]++;

        // update piece square look ups
        if (Piece.ofType(piece, Piece.coordinator)){
            const idx = Piece.getColor(piece) / 8 - 1;
            if (this.coordinators[idx] == 255)
                this.coordinators[idx] = sq;
            else
                throw new Error("Cannot have more than 1 coordinator on one side in a position");
        }else if (Piece.ofType(piece, Piece.chameleon)){
            if (isWhite){
                if (this.chameleons[0] == 255)
                    this.chameleons[0] = sq;
                else if (this.chameleons[1] == 255)
                    this.chameleons[1] = sq;
                else{
                    console.log("white", this.getFEN(), this.chameleons, sq);
                    throw new Error("Cannot have more than 2 chameleons on one side in a position");
                }
            }else{
                if (this.chameleons[2] == 255)
                    this.chameleons[2] = sq;
                else if (this.chameleons[3] == 255)
                    this.chameleons[3] = sq;
                else{
                    console.log("black", this.getFEN(), this.chameleons, sq);
                    throw new Error("Cannot have more than 2 chameleons on one side in a position");
                }
            }
        }else if (Piece.ofType(piece, Piece.king)){
            if (isWhite){
                if (this.kings[0] != 255)
                    throw new Error("Cannot have more than 1 king on one side in a position");
                this.kings[0] = sq;
            }else{
                if (this.kings[1] != 255)
                    throw new Error("Cannot have more than 1 king on one side in a position");
                this.kings[1] = sq;
            }
        }
    }

    // returns any unique identifiers to a position (arrangement of pieces, castling rights, en passant, whose turn it is, etc)
    getPosition(){
        let position = "";
        for (let i = 0; i < 64; i++){
            let v = this.squares[i];
            if (v){
                let c = PieceTypeToFEN[Piece.getType(v)];
                if (Piece.ofColor(v, Piece.white)) c = c.toUpperCase();
                position += c;
            }else{
                position += "0";
            }
        }
        position += this.turn;
        return position;
    }

    setResult(result, termination, winner){
        this.result = { result, termination, winner };
        return this.result;
    }

    // returns true if the given pieceType is within a 1 square in any direction to the given sq
    // AND if that piece is of opposite color to the given piece.
    inVicinity(sq, piece, pieceType){
        // go through all 8 directions
        for (let i = 0; i < 8; i++){

            // prevent wrapping around board
            if (numSquaresToEdge[sq][i] == 0)
                continue;

            const target = sq + dirOffsets[i];
            const targetValue = this.squares[target];

            if (Piece.ofType(targetValue, pieceType) && !Piece.ofColor(piece, targetValue)){
                return true;
            }

        }
        return false;
    }

    // returns true if a given piece is within the sphere of influence of an enemy immobilizer.
    isImmobilized(sq, piece){
        if (this.inVicinity(sq, piece, Piece.immobilizer))
            return true;
        if (Piece.ofType(piece, Piece.immobilizer))
            return this.inVicinity(sq, piece, Piece.chameleon);
        return false;
    }

    // retrieves the current player's king's square
    getKingSq(){
        return this.turn == Piece.black ? this.kings[0] : this.kings[1];
    }

    // actually retrieves the current player's king's square
    getCurKingSq(){
        return this.turn == Piece.white ? this.kings[0] : this.kings[1];
    }

    getEnemyKingSq(){
        return this.turn == Piece.white ? this.kings[1] : this.kings[0];
    }

    // retrieves the current player's coordinator's square
    getCurCoordSq(){
        return this.turn == Piece.white ? this.coordinators[0] : this.coordinators[1];
    }

    nextTurn(){
        this.turn = this.turn == Piece.white ? Piece.black : Piece.white;
    }
    
    // loads a FEN into this board state
    loadFEN(fen){
        // clear board first
        this.squares = new Uint8Array(64);
        delete this.result;
        this.coordinators[0] = 255;
        this.coordinators[1] = 255;
        this.chameleons[0] = 255;
        this.chameleons[1] = 255;
        this.chameleons[2] = 255;
        this.chameleons[3] = 255;
        this.kings[0] = 255;
        this.kings[1] = 255;
        this.pieceCounts = [ [ 0, 0, 0, 0, 0, 0, 0, 0 ], [ 0, 0, 0, 0, 0, 0, 0, 0 ] ];

        // 0 = board state
        // 1 = turn
        // 2 = fullmove number (number of fullmoves, starts at 1, incremented after black's move)
        let segments = fen.split(" ");

        // rewrite board state
        let state = segments[0];
        let f = 0;
        let r = 7;
        for (let i = 0; i < state.length; i++){
            let c = state[i];
            
            if (c == "/"){
                r--;
                f = 0;
            }else if (FENToPiece[c]){
                let piece = FENToPiece[c];
                let sq = f + r * 8;
                this.squares[sq] = piece;
                f++;

                const isWhite = Piece.ofColor(piece, Piece.white);
                this.pieceCounts[isWhite ? 0 : 1][Piece.getType(piece)]++;

                // if the piece is a king, record it
                if (Piece.ofType(piece, Piece.king)){
                    isWhite ? this.kings[0] = sq : this.kings[1] = sq;
                }

                // if the piece is a coordinator, record it
                if (Piece.ofType(piece, Piece.coordinator)){
                    isWhite ? this.coordinators[0] = sq : this.coordinators[1] = sq;
                }

                if (Piece.ofType(piece, Piece.chameleon)){
                    if (isWhite){
                        if (this.chameleons[0] == 255){
                            this.chameleons[0] = sq;
                        }else{
                            this.chameleons[1] = sq;
                        }
                    }else{
                        if (this.chameleons[2] == 255){
                            this.chameleons[2] = sq;
                        }else{
                            this.chameleons[3] = sq;
                        }
                    }
                }
            }else{
                f += parseInt(c);
            }
        }

        // set proper turn
        if (segments[1].toLowerCase() == "w"){
            this.turn = Piece.white;
        }else{
            this.turn = Piece.black;
        }

        // halfmove clock
        this.halfmoves = [ parseInt(segments[2]) || 0 ];

        // fullmove clock
        this.fullmove = parseInt(segments[3]);
        if (isNaN(this.fullmove))
            this.fullmove = "-";
    }

    getFEN(){
        let FEN = "";

        // write board state into FEN
        for (let r = 7; r >= 0; r--){
            let empty = 0;
            for (let f = 0; f < 8; f++){
                let v = this.squares[f + r * 8];
                if (v){
                    if (empty) FEN += empty;
                    empty = 0;

                    let pieceFEN = PieceTypeToFEN[Piece.getType(v)];
                    FEN += Piece.ofColor(v, Piece.white) ? pieceFEN.toUpperCase() : pieceFEN.toLowerCase();
                }else{
                    empty++;
                }
            }
            if (empty)
                FEN += empty;
            FEN += "/";
        }
        FEN = FEN.substring(0, FEN.length - 1);

        // set proper turn
        let turn = Piece.ofColor(this.turn, Piece.white) ? "w" : "b";

        FEN += ` ${turn} ${this.halfmoves[0]} ${this.fullmove}`;

        return FEN;
    }
}
