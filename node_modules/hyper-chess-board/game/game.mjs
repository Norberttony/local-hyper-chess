
// contains all of the game logic

// this code REPEATEDLY violates the DRY principle. read at your own risk.

import { algebraicToSquare } from "./coords.mjs";
import { Piece, FENToPiece } from "./piece.mjs";
import { numSquaresToEdge, dirOffsets } from "./pre-game.mjs";
import { getMoveSAN, removeGlyphs } from "./san.mjs";
import { MoveGenerator } from "./move-gen.mjs";

export const StartingFEN = "unbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNU w 0 1";

// The Board object contains a game state of the board. Certain moves can be done or undone, but
// they are not stored.
// Note on three fold repetition checking:
// - class Board DOES NOT handle it currently! all of it is done by the GraphicalState (because it
//      is rather slow). I was considering implementing Zobrist hashing for Board to allow really
//      fast searching, albeit occasionally very very slightly inaccurate. That has not been done :)
export class Board extends MoveGenerator {
    constructor(){
        super();
        this.loadFEN(StartingFEN);
    }

    // checks if the current player is checkmated... or stalemated...
    isGameOver(moves = undefined){
        if (this.result)
            return this.result;

        if (!moves)
            moves = this.generateMoves();

        // no legal moves?!
        if (moves.length == 0){
            this.nextTurn();
            if (this.isAttacked(this.getKingSq())){
                // CHECKMATE!!!
                this.winner = this.turn;
                if (this.winner == Piece.black)
                    this.setResult("0-1", "checkmate", this.turn);
                else
                    this.setResult("1-0", "checkmate", this.turn);
            }else{
                // stalemate...!
                this.winner = 0;
                this.setResult("1/2-1/2", "stalemate", 0);
            }
            this.nextTurn();
        }else{
            // determine if it is a draw by insufficient material
            let sufficient = false;
            for (let i = Piece.king; i <= Piece.immobilizer; i++){
                if (i == Piece.king || i == Piece.straddler)
                    continue;
                if (this.pieceCounts[0][i] != 0 || this.pieceCounts[1][i] != 0){
                    sufficient = true;
                    break;
                }
            }

            if (!sufficient){
                // KvK, KPvK, KPPvK, KPPvKP are all immediate draws.
                let most = Math.max(this.pieceCounts[0][Piece.straddler], this.pieceCounts[1][Piece.straddler]);
                let least = Math.min(this.pieceCounts[0][Piece.straddler], this.pieceCounts[1][Piece.straddler]);
                if (most <= 1 || most == 2 && least <= 1){
                    // certain draw.
                    this.setResult("1/2-1/2", "insufficient material", 0);
                }
            }
            
        }

        return this.result;
    }

    // gets move given SAN
    getMoveOfSAN(san){
        if (!san)
            return;

        // take a short cut by considering the destination square of the san and the move piece's type
        san = removeGlyphs(san);
        const toSq = algebraicToSquare(san.substring(san.length - 2));
        const pieceValue = FENToPiece[this.turn == Piece.white ? san[0] : san[0].toLowerCase()];

        if (toSq < 0 || toSq >= 64 || isNaN(toSq))
            return;

        const possibleMoves = [];
        for (let j = 0; j < dirOffsets.length; j++){
            let blockerCase = Piece.ofType(pieceValue, Piece.springer) || Piece.ofType(pieceValue, Piece.chameleon) ? 1 : 0;
            let isCham = Piece.ofType(pieceValue, Piece.chameleon);
            for (let i = 1; i <= numSquaresToEdge[toSq][j]; i++){
                const startSq = toSq + i * dirOffsets[j];
                const val = this.squares[startSq];
                if (val){
                    if (val == pieceValue){
                        const pieceMoves = this.generatePieceMoves(startSq, val, false);
                        for (const m of pieceMoves){
                            if (m.to == toSq){
                                possibleMoves.push(m);
                            }
                        }
                    }
                    if (Piece.getColor(pieceValue) != Piece.getColor(val)){
                        if (blockerCase && (!isCham || Piece.ofType(val, Piece.springer)))
                            blockerCase--;
                        else
                            break;
                    }else{
                        break;
                    }
                }
            }
        }

        for (const m of possibleMoves){
            // only consider SAN if to squares and piece types match
            if (m.to != toSq || this.squares[m.from] != pieceValue)
                continue;

            const SAN = getMoveSAN(this, m, possibleMoves, false);
            if (removeGlyphs(SAN) == san){
                return m;
            }
        }

        console.error(san, possibleMoves, this.getFEN());
        throw new Error(`Move of SAN ${san} could not be found.`);
    }

    getMoveOfLAN(LAN){
        const moves = this.generateMoves(true);

        for (const m of moves){
            if (m.uci == LAN){
                return m;
            }
        }
    }
}
