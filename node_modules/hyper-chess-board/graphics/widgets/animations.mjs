
// handles move animations

import { getFileFromSq, getRankFromSq } from "../../game/coords.mjs";
import { Piece } from "../../game/piece.mjs";
import { BoardWidget } from "./board-widget.mjs";
import { getPieceFromPool, setElemLocation } from "../pool.mjs";


export class AnimationWidget extends BoardWidget {
    constructor(boardgfx){
        super(boardgfx);

        this.queuedAnimations = [];

        boardgfx.skeleton.addEventListener("single-scroll", (event) => {
            this.singleScroll(event);
        });
    }

    singleScroll(event){
        const { prevVariation, variation, userInput } = event.detail;

        let isFlipped = this.boardgfx.isFlipped;

        // clear queued animations
        for (const a of this.queuedAnimations)
            clearTimeout(a);
        this.queuedAnimations = [];

        if (userInput)
            return;

        // display the board from just before the move was made.
        const dir = variation.prev == prevVariation ? 1 : -1;
        let lastMadeMove = variation.move;
        if (dir == -1)
            lastMadeMove = prevVariation.move;

        if (!lastMadeMove)
            return;

        // make captured pieces disappear
        for (const c of lastMadeMove.captures){
            const piece = getPieceFromPool(getFileFromSq(c.sq), getRankFromSq(c.sq), isFlipped, Piece.getType(c.captured), Piece.getColor(c.captured));
            piece.classList.add("board-graphics__piece--captured");
            this.boardgfx.piecesDiv.appendChild(piece);
        }

        // now move piece graphically
        let piece;

        if (dir == 1){
            piece = this.boardgfx.getPieceElem(getFileFromSq(lastMadeMove.to), getRankFromSq(lastMadeMove.to));
            setElemLocation(piece, getFileFromSq(lastMadeMove.from), getRankFromSq(lastMadeMove.from), isFlipped);
        }else{
            piece = this.boardgfx.getPieceElem(getFileFromSq(lastMadeMove.from), getRankFromSq(lastMadeMove.from));
            setElemLocation(piece, getFileFromSq(lastMadeMove.to), getRankFromSq(lastMadeMove.to), isFlipped);
        }

        let qa = this.queuedAnimations;
        const timeout = setTimeout(() => {
            if (dir == 1)
                setElemLocation(piece, getFileFromSq(lastMadeMove.to), getRankFromSq(lastMadeMove.to), isFlipped);
            else
                setElemLocation(piece, getFileFromSq(lastMadeMove.from), getRankFromSq(lastMadeMove.from), isFlipped);

            const index = qa.indexOf(timeout);
            if (index > -1)
                qa.splice(index, 1);

            qa = null;
            piece = null;
            isFlipped = null;
        }, 10);

        this.queuedAnimations.push(timeout);
    }
}
