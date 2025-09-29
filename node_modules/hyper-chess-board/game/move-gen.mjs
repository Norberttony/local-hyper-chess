
// Contains all of the code responsible for legal move generation.

import { Piece } from "./piece.mjs";
import { RawBoard } from "./raw-board.mjs";
import { Move } from "./move.mjs";
import { numSquaresToEdge, dirOffsets } from "./pre-game.mjs";
import { getRankFromSq, getFileFromSq } from "./coords.mjs";


export class MoveGenerator extends RawBoard {
    constructor(){
        super();
    }

    // returns true if a certain square is attacked
    isAttacked(sq){
        // go through every move
        let test = this.generateMoves(false);
        for (const m of test){
            for (const c of m.captures){
                if (c.sq == sq)
                    return true;
            }
        }

        return false;
    }

    // detects which piece this is, and generates moves for it. Generally used for graphical side of app.
    generatePieceMoves(start, piece, filter = true, moves = []){
        if (Piece.ofColor(piece, this.turn)){
            switch(Piece.getType(piece)){
                case Piece.straddler:
                    this.generateStraddlerMoves(start, piece, moves);
                    break;
                case Piece.coordinator:
                    this.generateCoordinatorMoves(start, piece, moves);
                    break;
                case Piece.springer:
                    this.generateSpringerMoves(start, piece, moves);
                    break;
                case Piece.retractor:
                    this.generateRetractorMoves(start, piece, moves);
                    break;
                case Piece.immobilizer:
                    this.generateImmobilizerMoves(start, piece, moves);
                    break;
                case Piece.chameleon:
                    this.generateChameleonMoves(start, piece, moves);
                    break;
                case Piece.king:
                    this.generateKingMoves(start, piece, moves);
                    break;
            }
        }

        if (filter)
            return this.filterLegalMoves(moves);
        else
            return moves;
    }

    // generates all possible moves for the given turn
    generateMoves(filter = true){
        const moves = [];

        for (let s = 0; s < 64; s++){
            const piece = this.squares[s];
            this.generatePieceMoves(s, piece, false, moves);
        }

        if (filter)
            return this.filterLegalMoves(moves);

        return moves;
    }

    generateChameleonMoves(start, piece, moves){
        if (this.isImmobilized(start, piece))
            return;

        // for copying coordinator moves
        const enemyCoordSq = this.coordinators[this.turn == Piece.white ? 1 : 0];
        const enemyCoordRank = getRankFromSq(enemyCoordSq);
        const enemyCoordFile = getFileFromSq(enemyCoordSq);

        const kingSq = this.getCurKingSq();
        const kingRank = getRankFromSq(kingSq);
        const kingFile = getFileFromSq(kingSq);

        // for copying king moves
        const coordSq = this.coordinators[this.turn == Piece.white ? 0 : 1];
        const coordRank = getRankFromSq(coordSq);
        const coordFile = getFileFromSq(coordSq);

        const enemyKingSq = this.getEnemyKingSq();
        const enemyKingRank = getRankFromSq(enemyKingSq);
        const enemyKingFile = getFileFromSq(enemyKingSq);

        // determines number of valid directions the piece can go through
        for (let i = 0; i < 8; i++){
            // goes through all squares until it hits an edge
            for (let j = 0; j < numSquaresToEdge[start][i]; j++){

                const target = start + dirOffsets[i] * (j + 1);
                const targetValue = this.squares[target];

                const captures = [];

                // check coordinator type moves
                // checking for targetValue == 0 is fine because a coordinator cannot make a
                // capturing move that occupies the enemy's square.
                if (targetValue == 0 && kingSq != 255 && enemyCoordSq != 255){
                    const targetRank = getRankFromSq(target);
                    const targetFile = getFileFromSq(target);
                    if (kingRank == enemyCoordRank && targetFile == enemyCoordFile || kingFile == enemyCoordFile && targetRank == enemyCoordRank){
                        captures.push({sq: enemyCoordSq, captured: this.squares[enemyCoordSq]});
                    }
                }

                // check retractor type moves
                if (targetValue == 0 && j == 0){
                    // check backwards
                    let d = (i + 2) % 4;
                    if (i >= 4)
                        d += 4;

                    if (numSquaresToEdge[start][d] > 0){
                        const deathSq = start + dirOffsets[d];
                        const deathVal = this.squares[deathSq];
                        if (deathVal != 0 && !Piece.ofColor(piece, deathVal) && Piece.ofType(deathVal, Piece.retractor)){
                            captures.push({sq: deathSq, captured: deathVal});
                        }
                    }
                }

                // check king type moves
                if (targetValue != 0 && j == 0 && !Piece.ofColor(piece, targetValue) && Piece.ofType(targetValue, Piece.king)){
                    // this would cause problems if the king was not a royal piece. but it is :)
                    moves.push(new Move(target, start, [{sq: target, captured: targetValue}]));
                    break;
                }

                // check springer type moves
                if (targetValue != 0 && !Piece.ofColor(piece, targetValue) && Piece.ofType(targetValue, Piece.springer) && numSquaresToEdge[target][i] > 0 && this.squares[target + dirOffsets[i]] == 0){
                    // there is actually no way for this move to be covered because of the rules :)
                    moves.push(new Move(target + dirOffsets[i], start, [{sq: target, captured: targetValue}]));
                    break;
                }

                // king type moves, where chameleon acts like king and teams up with own coordinator
                if (targetValue == 0 && j == 0 && coordSq != 255){
                    const targetRank = getRankFromSq(target);
                    const targetFile = getFileFromSq(target);

                    if (targetRank == enemyKingRank && coordFile == enemyKingFile || targetFile == enemyKingFile && coordRank == enemyKingRank){
                        captures.push({sq: enemyKingSq, captured: this.squares[enemyKingSq]});
                    }
                }

                // straddler type moves
                if (targetValue == 0 && i < 4){
                    for (let k = -1; k <= 1; k++){
                        const d = (i + 4 + k) % 4;

                        if (numSquaresToEdge[target][d] <= 1)
                            continue;

                        const nextTarget = target + dirOffsets[d];
                        const nextTargetValue = this.squares[nextTarget];

                        if (!Piece.ofColor(piece, nextTargetValue) && Piece.ofType(Piece.straddler, nextTargetValue)){
                            const nextNextTarget = target + 2 * dirOffsets[d];
                            const nextNextTargetValue = this.squares[nextNextTarget];

                            if (Piece.ofColor(piece, nextNextTargetValue) && (Piece.ofType(nextNextTargetValue, Piece.chameleon) || Piece.ofType(nextNextTargetValue, Piece.straddler))){
                                captures.push({sq: nextTarget, captured: nextTargetValue});
                            }
                        }
                    }
                }

                if (targetValue == 0)
                    moves.push(new Move(target, start, captures));
                else
                    break;

            }
        }
    }

    generateImmobilizerMoves(start, piece, moves){
        if (this.isImmobilized(start, piece))
            return;

        const dirStart = 0;
        const dirEnd = 8;
    
        // determines number of valid directions the piece can go through
        for (let i = dirStart; i < dirEnd; i++){
            // goes through all squares until it hits an edge
            for (let j = 0; j < numSquaresToEdge[start][i]; j++){
                const target = start + dirOffsets[i] * (j + 1);
                const targetValue = this.squares[target];

                if (targetValue == 0){
                    moves.push(new Move(target, start));
                }else{
                    break;
                }
            }
        }
    }

    generateRetractorMoves(start, piece, moves){
        if (this.isImmobilized(start, piece))
            return;

        const dirStart = 0;
        const dirEnd = 8;
    
        // determines number of valid directions the piece can go through
        for (let i = dirStart; i < dirEnd; i++){
            // goes through all squares until it hits an edge
            for (let j = 0; j < numSquaresToEdge[start][i]; j++){

                const target = start + dirOffsets[i] * (j + 1);
                const targetValue = this.squares[target];

                const captures = [];
                if (targetValue == 0 && j == 0){
                    // check backwards
                    let d = (i + 2) % 4;
                    if (i >= 4)
                        d += 4;

                    if (numSquaresToEdge[start][d] > 0){
                        const deathSq = start + dirOffsets[d];
                        const deathVal = this.squares[deathSq];
                        if (deathVal != 0 && !Piece.ofColor(piece, deathVal))
                            captures.push({ sq: deathSq, captured: deathVal });
                    }
                }
                
                if (targetValue != 0)
                    break;

                moves.push(new Move(target, start, captures));
            }
        }
    }

    generateSpringerMoves(start, piece, moves){
        if (this.isImmobilized(start, piece))
            return;

        // moves like a chess queen
        for (let i = 0; i < 8; i++){
            // goes through all squares until it hits an edge
            for (let j = 0; j < numSquaresToEdge[start][i]; j++){

                const target = start + dirOffsets[i] * (j + 1);
                const targetValue = this.squares[target];

                if (targetValue != 0){

                    if (Piece.ofColor(piece, targetValue))
                        break;

                    if (numSquaresToEdge[target][i] == 0)
                        continue;

                    const nextTarget = target + dirOffsets[i];
                    const nextTargetValue = this.squares[nextTarget];

                    if (nextTargetValue == 0){
                        // jump over piece
                        moves.push(new Move(nextTarget, start, [{sq: target, captured: targetValue}]));
                    }
                    break;

                }else{
                    moves.push(new Move(target, start));
                }
            }
        }
    }

    generateCoordinatorMoves(start, piece, moves){
        if (this.isImmobilized(start, piece))
            return;

        const dirStart = 0;
        const dirEnd = 8;

        // a chameleon cannot team up with another chameleon to capture the king.
        // that would make two chameleons much too powerful :)
        const considerSquares = [
            this.getCurKingSq(),
            this.chameleons[this.turn == Piece.white ? 0 : 2],
            this.chameleons[this.turn == Piece.white ? 1 : 3]
        ].filter((val => val != 255));

        const ranks = considerSquares.map((val => getRankFromSq(val)));
        const files = considerSquares.map((val => getFileFromSq(val)));
    
        // determines number of valid directions the piece can go through
        for (let i = dirStart; i < dirEnd; i++){
            // goes through all squares until it hits an edge
            for (let j = 0; j < numSquaresToEdge[start][i]; j++){

                const target = start + dirOffsets[i] * (j + 1);
                const targetValue = this.squares[target];

                if (targetValue != 0)
                    break;

                const rank = getRankFromSq(target);
                const file = getFileFromSq(target);

                let captures = [];
                for (let s = 0; s < considerSquares.length; s++){
                    const sqRank = ranks[s];
                    const sqFile = files[s];
                    if (sqRank != rank && sqFile != file){
                        // death squares are formed
                        const death1 = rank * 8 + sqFile;
                        const death1Value = this.squares[death1];
                        const death2 = sqRank * 8 + file;
                        const death2Value = this.squares[death2];

                        if (death1Value && !Piece.ofColor(piece, death1Value)){
                            // if chameleon, must be capturing a king
                            if (s == 0 || s > 0 && Piece.ofType(death1Value, Piece.king))
                                captures.push({sq: death1, captured: death1Value});
                        }
                        if (death2Value && !Piece.ofColor(piece, death2Value)){
                            // if chameleon, must be capturing a king
                            if (s == 0 || s > 0 && Piece.ofType(death2Value, Piece.king))
                                captures.push({sq: death2, captured: death2Value});
                        }
                    }
                }

                moves.push(new Move(target, start, captures));
            }
        }
    }

    generateStraddlerMoves(start, piece, moves){
        if (this.isImmobilized(start, piece))
            return;

        // determines number of valid directions the piece can go through
        let canMoveForward = false;
        for (let i = 0; i < 4; i++){
            // goes through all squares until it hits an edge
            for (let j = 0; j < numSquaresToEdge[start][i]; j++){

                const target = start + dirOffsets[i] * (j + 1);
                const targetValue = this.squares[target];

                if (targetValue != 0)
                    break;

                // straddler can now capture a piece ahead of it, to its left, or to its right (relative to movement)
                const captures = [];
                for (let k = -1; k <= 1; k++){
                    const d = (i + 4 + k) % 4;

                    const nextTarget = target + dirOffsets[d];
                    const nextTargetValue = this.squares[nextTarget];

                    if (numSquaresToEdge[target][d] <= 1){
                        if (nextTargetValue == 0)
                            canMoveForward = true;
                        continue;
                    }

                    const nextNextTarget = target + dirOffsets[d] * 2;
                    const nextNextTargetValue = this.squares[nextNextTarget];

                    // must have a center target and a straddler on the other side for the...
                    // CUSTODIAN CAPTURE.
                    // If any of the encompassing pieces are chameleons, the captured piece must also be a straddler.
                    // must be some of the ugliest code in the whole while world :)
                    const chameleonCapt = Piece.ofType(nextNextTargetValue, Piece.chameleon);
                    const canCapture = chameleonCapt && Piece.ofType(nextTargetValue, Piece.straddler) || !chameleonCapt && Piece.ofType(nextNextTargetValue, Piece.straddler);
                    if (nextTargetValue != 0 && !Piece.ofColor(piece, nextTargetValue) && Piece.ofColor(nextNextTargetValue, piece) && canCapture){
                        captures.push({sq: nextTarget, captured: nextTargetValue});
                    }else if (nextTargetValue == 0 && k == 0){
                        canMoveForward = true;
                    }
                }

                moves.push(new Move(target, start, captures));

                if (!canMoveForward){
                    break;
                }
            }
        }

        return moves;
    }

    // generates moves for a king
    generateKingMoves(start, piece, moves){
        if (this.isImmobilized(start, piece))
            return;

        // king can team up with its own coordinator to create death squares
        const coordSq = this.getCurCoordSq();
        const coordRank = getRankFromSq(coordSq);
        const coordFile = getFileFromSq(coordSq);

        // see if king can team up with chameleon and capture an enemy coordinator!
        const enemyCoordSq = this.coordinators[this.turn == Piece.white ? 1 : 0];
        const enemyCoordRank = getRankFromSq(enemyCoordSq);
        const enemyCoordFile = getFileFromSq(enemyCoordSq);

        // check all directions
        for (let i = 0; i < dirOffsets.length; i++){
            if (numSquaresToEdge[start][i] > 0){

                const target = start + dirOffsets[i];
                const targetValue = this.squares[target];

                if (targetValue != 0 && Piece.ofColor(piece, targetValue)){
                    continue;
                }

                const rank = getRankFromSq(target);
                const file = getFileFromSq(target);

                const captures = [];
                if (coordSq != 255 && coordRank != rank && coordFile != file){
                    // death squares are formed
                    const death1 = rank * 8 + coordFile;
                    const death1Value = this.squares[death1];
                    const death2 = coordRank * 8 + file;
                    const death2Value = this.squares[death2];

                    if (death1Value && !Piece.ofColor(piece, death1Value)){
                        captures.push({sq: death1, captured: death1Value});
                    }
                    if (death2Value && !Piece.ofColor(piece, death2Value)){
                        captures.push({sq: death2, captured: death2Value});
                    }
                }

                // test for king-chameleon death squares
                if (enemyCoordSq != 255){
                    const thisRank = getRankFromSq(target);
                    const thisFile = getFileFromSq(target);

                    const chamStart = this.turn == Piece.white ? 0 : 2;
                    const chamEnd = this.turn == Piece.white ? 2 : 4;
                    for (let i = chamStart; i < chamEnd; i++){
                        if (this.chameleons[i] == 255)
                            break;

                        const rank = getRankFromSq(this.chameleons[i]);
                        const file = getFileFromSq(this.chameleons[i]);

                        // forms death squares, but only against the enemy coordinator.
                        // and there's always only one enemy coordinator.
                        // of course, the king isn't actually forming chameleon death squares if the two are aligned (rank/file)
                        if (rank == enemyCoordRank && thisFile == enemyCoordFile && thisFile != file && thisRank != rank){
                            captures.push({sq: enemyCoordSq, captured: this.squares[enemyCoordSq]});
                            break;
                        }
                        if (file == enemyCoordFile && thisRank == enemyCoordRank && thisFile != file && thisRank != rank){
                            captures.push({sq: enemyCoordSq, captured: this.squares[enemyCoordSq]});
                            break;
                        }
                    }
                }

                if (targetValue != 0 && !Piece.ofColor(piece, targetValue)){
                    captures.push({sq: target, captured: targetValue});
                }

                moves.push(new Move(target, start, captures));
            }
        }
    }

    // takes in a list of moves, and gives a list of all legal moves
    filterLegalMoves(moves){
        return moves.filter((move) => this.isMoveLegal(move));
    }

    // checks if a move is legal
    isMoveLegal(move){
        this.makeMove(move);

        // if the move causes the current king to stay in check, then it can't be legal
        const attacksKing = this.isAttacked(this.getKingSq());

        this.unmakeMove(move);

        return !attacksKing;
    }

    // performs a move on the board. this method assumes that the given move is LEGAL
    // if the move is not legal, then some funny behavior could occur.
    makeMove(move){
        // update halfmove counter
        this.halfmoves.unshift(this.halfmoves[0] + 1);
        if (move.captures.length > 0)
            this.halfmoves[0] = 0;

        // go through all of the captures
        for (const { sq } of move.captures)
            this.pickup(sq);

        // moves the piece to its designated square, leaving nothing behind
        this.placedown(move.to, this.pickup(move.from));
        
        // fullmove
        if (Piece.ofColor(this.turn, Piece.black)){
            if (this.fullmove != "-")
                this.fullmove++;
        }

        // set turn
        this.nextTurn();
    }

    // un-does a move on the board (make sure that the move being undone is the most recent made move)
    unmakeMove(move){
        // update halfmove counter
        this.halfmoves.shift();

        // unmove the piece and uncapture whatever it captured.
        this.placedown(move.from, this.pickup(move.to));
        for (const { sq, captured } of move.captures)
            this.placedown(sq, captured);

        // set turn
        this.nextTurn();

        // fullmove
        if (Piece.ofColor(this.turn, Piece.black) && this.fullmove != "-"){
            this.fullmove--;
        }

        // removes any stored result
        delete this.result;
    }
    // ==== END MOVE GENERATION AND CHECKING ==== //
}
