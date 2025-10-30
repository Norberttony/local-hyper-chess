
import { BoardWidget, getFirstElemOfClass } from "./board-widget.js";
import { Piece } from "../../game/piece.js";
import { addPointerHoldListener } from "../pgn/pgn-control.js";

// handles displaying any of the moves in a separate panel, splitting the PGN into variations as
// necessary.

// The PGN list structure is a little complicated as it must allow a practically infinite nesting
// of different variations, with a way to style main variation elements.

//  <div class="pgn-viewer__pgn-list">
//      <div class="pgn-viewer__pgn-moveline">
//          <div class="pgn-viewer__pgn-elem pgn-viewer__pgn-elem--type-num">1.</div>
//          <div class="pgn-viewer__pgn-elem pgn-viewer__pgn-elem--type-san">Pd4</div>
//          <div class="pgn-viewer__pgn-elem pgn-viewer__pgn-elem--type-san">Pf5</div>
//      </div>
//      <div class="pgn-viewer__pgn-moveline--type-variation">
//          <div class="pgn-viewer__pgn-elem pgn-viewer__pgn-elem--type-variation-line">
//              <div class="pgn-viewer__pgn-elem pgn-viewer__pgn-elem--type-san">Pe3</div>
//              <div class="pgn-viewer__pgn-elem pgn-viewer__pgn-elem--type-san">Ph3</div>
//          </div>
//      </div>
//  </div>

export class PGNWidget extends BoardWidget {
    constructor(boardgfx, location){
        super(boardgfx);

        const container = document.createElement("div");
        container.classList.add("pgn-viewer");
        boardgfx.getWidgetElem(location).appendChild(container);

        const pgnControl = document.createElement("div");
        pgnControl.classList.add("pgn-viewer__pgn-control");
        pgnControl.innerHTML = `
            <button class = "pgn-viewer__first">&lt;&lt;</button>
            <button class = "pgn-viewer__back">&lt;</button>
            <button class = "pgn-viewer__next">&gt;</button>
            <button class = "pgn-viewer__last">&gt;&gt;</button>`;
        container.appendChild(pgnControl);

        // determines the current next variation the user is selecting
        this.selectedVariation = 0;

        addPointerHoldListener(pgnControl.getElementsByClassName("pgn-viewer__back")[0], () => {
            this.PGNMoveBack();
        });
        addPointerHoldListener(pgnControl.getElementsByClassName("pgn-viewer__next")[0], () => {
            this.PGNMoveForward();
        });

        pgnControl.getElementsByClassName("pgn-viewer__first")[0].addEventListener("click", () => {
            // displays position with no moves made on the board
            this.PGNMoveFirst();
        });
        pgnControl.getElementsByClassName("pgn-viewer__last")[0].addEventListener("click", () => {
            // displays position of the last committed move in the main variation
            this.PGNMoveLast();
        });

        const pgnElem = document.createElement("div");
        // TO-DO: this should be here until the CSS class names are converted to a better format
        pgnElem.classList.add("pgn-viewer__pgn-list");
        container.appendChild(pgnElem);

        this.pgnElem = pgnElem;
        this.boardgfx = boardgfx;

        // event listeners
        boardgfx.skeleton.addEventListener("new-variation", (event) => {
            this.onNewVariation(event);
        });
        boardgfx.skeleton.addEventListener("result", (event) => {
            this.onResult(event);
        });
        boardgfx.skeleton.addEventListener("loadFEN", (event) => {
            this.onLoadFEN(event);
        });
        boardgfx.skeleton.addEventListener("variation-change", (event) => {
            this.onVariationChange(event);
        });
        boardgfx.skeleton.addEventListener("delete-variation", (event) => {
            this.onDeleteVariation(event);
        });

        document.body.addEventListener("keydown", (event) => this.keydown(event));
    }

    keydown(event){
        if (event.target == this.boardgfx.skeleton){
            switch (event.key.toLowerCase()){
                case "arrowleft":
                    this.PGNMoveBack();
                    break;
                case "arrowright":
                    this.PGNMoveForward();
                    break;
                case "arrowup":
                    this.PGNUpVariation();
                    break;
                case "arrowdown":
                    this.PGNDownVariation();
                    break;

                case "f":
                    this.boardgfx.flip();
                    break;

                // if no bound key was hit, do not prevent event default.
                default:
                    return;
            }
            event.preventDefault();
        }
    }

    PGNMoveBack(){
        if (this.boardgfx.previousVariation())
            this.boardgfx.applyChanges();
        this.selectedVariation = 0;
    }

    PGNMoveForward(){
        if (this.boardgfx.nextVariation(this.selectedVariation))
            this.boardgfx.applyChanges();
        this.selectedVariation = 0;
    }

    PGNUpVariation(){
        this.selectedVariation--;
        if (this.selectedVariation < 0)
            this.selectedVariation = this.boardgfx.currentVariation.next.length - 1;
    }

    PGNDownVariation(){
        const max = this.boardgfx.currentVariation.next.length;
        this.selectedVariation = (this.selectedVariation + 1) % max;
    }

    PGNMoveFirst(){
        // displays position with no moves made on the board
        this.boardgfx.jumpToVariation(this.boardgfx.variationRoot);
        this.boardgfx.applyChanges();
    }

    PGNMoveLast(){
        // displays position of the last committed move in the main variation
        let iter = this.boardgfx.currentVariation;
        while (iter.next[0]){
            iter = iter.next[0];
        }

        this.boardgfx.jumpToVariation(iter);
        this.boardgfx.applyChanges();
    }

    onNewVariation(event){
        const { variation } = event.detail;

        // determine move number
        const moveNum = variation.fullMoveNum;

        // determine the player who made this move
        const turn = variation.turn;

        // create a new SAN elem for this variation
        const sanElem = newSANElem(this.boardgfx, this.pgnElem, variation.san, variation);
        variation.element = sanElem;

        if (variation.isMain()){
            if (turn == Piece.black){
                // add this move to the previous move line
                const prevMoveline = variation.prev.element.parentNode;
                prevMoveline.appendChild(sanElem);

                // if the next element does not exist or is not a moveline, this must be the very end
                // of the pgn and a skip is required.
                const nextElem = prevMoveline.nextElementSibling;
                if (prevMoveline.getElementsByClassName("pgn-viewer__pgn-elem--type-blank")[0]){
                    // fetch next available moveline
                    let nextMovelineElem = nextElem;
                    while (!nextMovelineElem.classList.contains("pgn-viewer__pgn-moveline")){
                        nextMovelineElem = nextMovelineElem.nextElementSibling;
                    }

                    if (nextMovelineElem){
                        nextMovelineElem.appendChild(sanElem);
                    }
                }else if (nextElem && !isPGNSpecialBlock(nextElem)){
                    const blankSANElem = newBlankSANElem(this.boardgfx, this.pgnElem);
                    prevMoveline.appendChild(blankSANElem);

                    const moveline = newMovelineElem(moveNum, newBlankSANElem(this.boardgfx, this.pgnElem));
                    moveline.appendChild(sanElem);

                    // insert either after the special elements or just at the end.
                    if (!nextElem || !nextElem.nextElementSibling){
                        this.pgnElem.appendChild(moveline);
                    }else{
                        // keep searching for the next moveline element
                        let nextMoveline = nextElem;
                        while (nextMoveline && !nextMoveline.classList.contains("pgn-viewer__pgn-moveline"))
                            nextMoveline = nextMoveline.nextElementSibling;

                        // either moveline exists or we've reached the end of the pgn
                        if (nextMoveline)
                            this.pgnElem.insertBefore(moveline, nextMoveline);
                        else
                            this.pgnElem.appendChild(moveline);
                    }
                }
            }else{
                // create a new move line for this variation
                const moveline = newMovelineElem(moveNum, sanElem);
                const resultElem = document.getElementsByClassName("pgn-viewer__pgn-elem--type-result")[0];
                if (resultElem)
                    this.pgnElem.insertBefore(moveline, resultElem);
                else
                    this.pgnElem.appendChild(moveline);
            }
        }else{

            if (variation.location == 0){
                // same variation line
                const variationElem = variation.prev.element.parentNode;
                variationElem.appendChild(sanElem);
            }else{
                // create a new variation object to contain all of the variations after the previous
                // moveline
                const variationLineElem = document.createElement("div");
                variationLineElem.classList.add("pgn-viewer__pgn-elem", "pgn-viewer__pgn-elem--type-variation-line");

                variationLineElem.appendChild(sanElem);
                
                let previousContainer = variation.prev.next[0].element.parentNode;

                if (previousContainer.classList.contains("pgn-viewer__pgn-moveline")){
                    const nextElem = previousContainer.nextElementSibling;
                    // do we split the moveline or not?
                    if (turn == Piece.white){
                        // split!!!
                        if (nextElem && nextElem.classList.contains("pgn-viewer__pgn-elem--type-variation")){
                            nextElem.appendChild(variationLineElem);
                        }else{
                            const variationElem = newVariationElem();
                            variationElem.appendChild(variationLineElem);

                            const [ m1, m2 ] = splitMovelineElem(this.boardgfx, this.pgnElem, previousContainer);
                            m1.parentNode.insertBefore(variationElem, m2);
                        }
                    }else{
                        const variationElem = newVariationElem();
                        variationElem.appendChild(variationLineElem);

                        // no split needed, just insert after moveline
                        if (nextElem)
                            this.pgnElem.insertBefore(variationElem, nextElem);
                        else
                            this.pgnElem.appendChild(variationElem);
                    }
                }else{
                    // this must be another simple variation element, so let's just add a variation to the variation
                    const variationElem = newVariationElem();
                    variationElem.appendChild(variationLineElem);
                    
                    previousContainer.appendChild(variationElem);
                }
            }
        }
    }

    onResult(event){
        const { result, turn, termination } = event.detail;

        // based on the result number, add some result text and flavor text
        const resultText = result.split("-").join(" - ");
        let flavorText;
        if (result == "1/2-1/2"){
            flavorText = "Game ended by";
        }else if (result == "0-1"){
            flavorText = "Black wins by";
        }else if (result == "1-0"){
            flavorText = "White wins by";
        }

        // displays result
        const pgn_resultElem = document.createElement("div");
        pgn_resultElem.classList.add("pgn-viewer__pgn-elem", "pgn-viewer__pgn-elem--type-result");
        pgn_resultElem.innerHTML = `<span>${resultText}</span><br /><span style = "font-size: large;">${flavorText} ${termination}</span>`;
        this.pgnElem.appendChild(pgn_resultElem);

        this.resultElem = pgn_resultElem;

        this.boardgfx.pgnData.setHeader("Result", resultText);
    }

    onLoadFEN(event){
        const { fen } = event.detail;
    
        // none of the previous PGN is relevant to this new position, so...
        this.pgnElem.innerHTML = "";
        this.boardgfx.pgnData.clear();
    
        if (fen.replace(/ /g, "") != StartingFEN.replace(/ /g, "")){
            this.boardgfx.pgnData.setHeader("Variant", "From Position");
            this.boardgfx.pgnData.setHeader("FEN", fen);
        }
    }
    
    onVariationChange(event){
        const { variation } = event.detail;
    
        selectPGNElem(this.pgnElem, variation.element);
    }

    onDeleteVariation(event){
        const { variation } = event.detail;

        if (variation == this.boardgfx.mainVariation && this.resultElem){
            this.resultElem.parentNode.removeChild(this.resultElem);
            delete this.resultElem;
        }

        this.deletePGNElement(variation.element);
    }

    deletePGNElement(elem){
        const parent = elem.parentNode;
        parent.removeChild(elem);

        // if the moveline no longer contains any moves, it's useless and should be removed.
        if (!getFirstElemOfClass(parent, "pgn-viewer__pgn-elem--type-san"))
            parent.parentNode.removeChild(parent);
    }
}


function selectPGNElem(pgnElem, elem){
    (document.getElementsByClassName("pgn-viewer__pgn-elem--selected")[0] || elem || document.body).classList.remove("pgn-viewer__pgn-elem--selected");
    if (elem){
        elem.classList.add("pgn-viewer__pgn-elem--selected");
        
        // scrolls to selected pgn
        let pgnRect = pgnElem.getBoundingClientRect();
        let elemRect = elem.getBoundingClientRect();
        let elemPos = elemRect.top - pgnRect.top; // element's position relative to the PGN scroll view

        // already in view! don't scroll!
        if (elemPos > 0 && elemPos + elemRect.height < pgnRect.height)
            return;

        // determine direction of scroll
        if (elemPos <= 0){
            // so we've scrolled past element, set it to top (as that is first occurrence)
            pgnElem.scrollBy(0, elemRect.top - pgnRect.top);
        }else{
            pgnElem.scrollBy(0, elemRect.bottom - pgnRect.bottom);
        }
    }else{
        pgnElem.scrollTo(0, 0);
    }
}

// creates and returns the new moveline with the given number and white elem.
function newMovelineElem(num, whiteSANElem){
    const moveline = document.createElement("div");

    moveline.classList.add("pgn-viewer__pgn-moveline");

    const numElem = document.createElement("div");
    numElem.classList.add("pgn-viewer__pgn-elem", "pgn-viewer__pgn-elem--type-num");
    numElem.innerText = `${num}.`;
    
    moveline.appendChild(numElem);
    moveline.appendChild(whiteSANElem);

    return moveline;
}

// returns a list of two elements, the first moveline element and the second moveline element
// if the given moveline elem is already split, this returns an empty list.
function splitMovelineElem(gameState, pgnElem, movelineElem){
    // cannot split a moveline that is already split.
    if (movelineElem.classList.contains("pgn_split-moveline"))
        return [];

    movelineElem.classList.add("pgn_split-moveline");

    const elem1 = movelineElem;

    const numText = elem1.getElementsByClassName("pgn-viewer__pgn-elem--type-num")[0].innerText;
    const elem2 = newMovelineElem(numText.substring(0, numText.length - 1), newBlankSANElem(gameState, pgnElem));

    const nextElem = elem1.nextElementSibling;
    if (nextElem)
        nextElem.parentNode.insertBefore(elem2, nextElem);
    else
        elem1.parentNode.appendChild(elem2);

    // swap the second move elem in the first moveline with a blank elem
    const blackMove = elem1.getElementsByClassName("pgn-viewer__pgn-elem--type-san")[1];
    if (blackMove){
        elem2.appendChild(blackMove);
    }
    elem1.appendChild(newBlankSANElem(gameState, pgnElem));

    return [ elem1, elem2 ];
}

function newSANElem(gameState, pgnElem, san, variation){
    const div = document.createElement("div");
    div.classList.add("pgn-viewer__pgn-elem", "pgn-viewer__pgn-elem--type-san");
    div.innerText = san;

    if (variation){
        div.addEventListener("click", () => {
            gameState.jumpToVariation(variation);
            gameState.applyChanges();
            selectPGNElem(pgnElem, div);
        });
    }

    return div;
}

function newBlankSANElem(gameState, pgnElem){
    const div = newSANElem(gameState, pgnElem, "...");
    div.classList.add("pgn-viewer__pgn-elem", "pgn-viewer__pgn-elem--type-blank");
    return div;
}

function newVariationElem(){
    const div = document.createElement("div");
    div.classList.add("pgn-viewer__pgn-elem", "pgn-viewer__pgn-elem--type-variation");
    return div;
}

function isPGNSpecialBlock(elem){
    return elem.classList.contains("pgn-viewer__pgn-moveline") || elem.classList.contains("pgn-viewer__pgn-elem--type-result");
}
