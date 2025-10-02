
import { Board } from "hyper-chess-board/index.mjs";
import { BoardWidget } from "hyper-chess-board/graphics/widgets/board-widget.mjs";
import { WIDGET_LOCATIONS } from "hyper-chess-board/graphics/widgets/index.mjs";

import { getFirstElemOfClass } from "../utils.js";
import { tabulateData, pollDatabase } from "../../network/db-utils.js";


const PUZZLE = {
    checkSrc:   "images/puzzles/checkmark.svg",
    xSrc:       "images/puzzles/x.svg",
    starSrc:    "images/puzzles/star.svg",
    id: 0,

    glyphCorrectSrc: "images/glyphs/correct.svg",
    glyphIncorrectSrc: "images/glyphs/incorrect.svg"
};

export class PuzzlesWidget extends BoardWidget {
    constructor(boardgfx){
        super(boardgfx);

        const puzzles = document.createElement("div");
        puzzles.classList.add("puzzles-widget");
        puzzles.innerHTML = `
            <div class = "puzzles-widget__img-container">
                <img class = "puzzles-widget__img" src = "">
            </div>
            <div class = "puzzles-widget__controls">
                <button class = "puzzles-widget__back">&lt;</button>
                <button class = "puzzles-widget__rdm">Click to go to a random puzzle</button>
                <button class = "puzzles-widget__next">&gt;</button>
            </div>
            <div class = "puzzles-widget__title">TITLE</div>
            <div class = "puzzles-widget__diff">Intermediate</div>
            <div class = "puzzles-widget__status">Unsolved</div>`;

        boardgfx.getWidgetElem(WIDGET_LOCATIONS.RIGHT).appendChild(puzzles);

        this.puzzlesElem       = puzzles;
        this.puzzlesTitleElem  = getFirstElemOfClass(puzzles, "puzzles-widget__title");
        this.puzzlesDiffElem   = getFirstElemOfClass(puzzles, "puzzles-widget__diff");
        this.puzzlesSolvedElem = getFirstElemOfClass(puzzles, "puzzles-widget__status");
        this.puzzlesImgElem    = getFirstElemOfClass(puzzles, "puzzles-widget__img");

        this.puzzlesSolved = (localStorage.getItem("puzzles_solved") || "").split("");
        this.currentPuzzle;

        // fetches puzzles
        this.puzzles = (async () => {
            const puzzles = tabulateData(await pollDatabase("GET", { type: "puzzles" }));

            let id = 0;
            for (const p of puzzles)
                p.id = id++;

            // user might have missed new puzzles
            while (this.puzzlesSolved.length < puzzles.length)
                this.puzzlesSolved.push("0");

            this.puzzles = puzzles;
            this.currentPuzzle = this.puzzles[0];
            this.verify();
        })();

        // add listeners to the back, random, and next buttons
        getFirstElemOfClass(puzzles, "puzzles-widget__back").addEventListener("click", () => {
            const newId = (this.currentPuzzle.id - 1 + this.puzzles.length) % this.puzzles.length;
            changeHash(`#puzzles=${newId}`);
        });

        getFirstElemOfClass(puzzles, "puzzles-widget__next").addEventListener("click", () => {
            const newId = (this.currentPuzzle.id + 1) % this.puzzles.length;
            changeHash(`#puzzles=${newId}`);
        });

        getFirstElemOfClass(puzzles, "puzzles-widget__rdm").addEventListener("click", () => {
            const newId = this.getRandomUnsolvedPuzzle();
            changeHash(`#puzzles=${newId}`);
        });

        this.singleScrollListener = (event) => this.singleScroll(event);

        this.clear();
    }

    async enable(){
        this.puzzlesElem.style.display = "";
        if (this.puzzles instanceof Promise){
            showDialogBox("Fetching puzzles", "The puzzles are being fetched from the database, please wait...");
            await this.puzzles;
            hideDialogBox();
        }
    }

    disable(){
        this.stop();
        this.puzzlesElem.style.display = "none";
    }

    // clears current puzzle info
    clear(){
        this.puzzlesImgElem.src = "";
        this.puzzlesDiffElem.innerText = "";
        this.puzzlesSolvedElem.innerText = "";
        this.puzzlesTitleElem.innerText = "";
    }

    loadPuzzle(id){
        this.clear();

        if (this.puzzlesSolved[id] == "1"){
            this.puzzlesImgElem.src = PUZZLE.starSrc;
            this.puzzlesSolvedElem.innerText = "Solved";
        }else{
            this.puzzlesSolvedElem.innerText = "Unsolved";
        }

        const puzzle = this.puzzles[id];
        this.currentPuzzle = puzzle;

        // display stats
        this.puzzlesTitleElem.innerText = puzzle.title;
        this.puzzlesDiffElem.innerText = puzzle.difficulty;

        // load FEN
        this.boardgfx.loadFEN(puzzle.fen);

        // disallow moving for enemy side
        this.userSide = this.boardgfx.state.turn;
        this.oppSide = this.boardgfx.state.turn == Piece.white ? Piece.black : Piece.white;
        this.boardgfx.allowInputFrom[this.userSide] = true;
        this.boardgfx.allowInputFrom[this.oppSide] = false;

        // flip the board to the user's perspective
        this.boardgfx.setFlip(this.userSide == Piece.black);

        this.moveIndex = 0; // index of currently expected move

        this.puzzlesElem.style.display = "";

        this.boardgfx.skeleton.addEventListener("single-scroll", this.singleScrollListener);
        this.boardgfx.graphicalVariation = this.boardgfx.currentVariation;
    }

    verify(){
        const board = new Board();
        let id = 2;
        for (const { fen, solution } of this.puzzles){
            board.loadFEN(fen);

            try {
                for (const branch of solution){
                    if (typeof branch == "string"){
                        const san = branch;
                        const move = board.getMoveOfSAN(san);
                        board.makeMove(move);
                    }else{
                        for (const san of branch)
                            board.getMoveOfSAN(san);
                    }
                }
            }catch(err){
                console.error(`Checking puzzle #${id} results in error:`, err);
            }

            id++;
        }
    }

    getRandomUnsolvedPuzzle(){
        let unsolvedPuzzlesAmt = 0;
        for (const a of this.puzzlesSolved){
            if (a == 0)
                unsolvedPuzzlesAmt++;
        }

        if (unsolvedPuzzlesAmt > 0){
            let unsolvedNum = Math.floor(Math.random() * unsolvedPuzzlesAmt);
            let id = 0;
            for (let i = 0; i < this.puzzlesSolved.length; i++){
                if (this.puzzlesSolved[i] == 0)
                    unsolvedNum--;
                if (unsolvedNum < 0){
                    break;
                }
                id++;
            }
            return id;
        }else{
            alert("You've solved all of the puzzles so far! Well done!");
            return -1;
        }
    }

    singleScroll(event){
        const { prevVariation, variation, userInput } = event.detail;

        if (!userInput)
            return;

        const puzzle = this.currentPuzzle;

        const pgn = removeGlyphs(variation.san);
        const correctMove = puzzle.solution[prevVariation.level];

        // check if the move that the user played is one of the correct moves.
        let isCorrectMove = false;
        if (correctMove){
            if (typeof correctMove == "string"){
                isCorrectMove = pgn == correctMove;
            }else if (typeof correctMove == "object"){
                isCorrectMove = correctMove.indexOf(pgn) > -1;
            }
        }

        // ensure player is actually following the puzzle's correct variation.
        const correctVariation =
            !variation.prev || !variation.prev.prev ||
            removeGlyphs(variation.prev.prev.san) == puzzle.solution[prevVariation.level - 2];

        const canIncMoveIndex = this.moveIndex == prevVariation.level;

        if (isCorrectMove && correctVariation){
            variation.glyphs.push(PUZZLE.glyphCorrectSrc);

            if (canIncMoveIndex)
                this.moveIndex++;

            this.puzzlesImgElem.src = PUZZLE.checkSrc;
            
            // play opponent's next move
            if (prevVariation.level + 1 < puzzle.solution.length){
                this.playMove(puzzle.solution[prevVariation.level + 1]);
                if (canIncMoveIndex)
                    this.moveIndex++;
            }else{
                // check if finished puzzle
                this.puzzlesImgElem.src = PUZZLE.starSrc;
                this.puzzlesSolvedElem.innerText = "Solved";
                this.puzzlesSolved[puzzle.id] = "1";
                this.save();
                this.stop();
            }
        }else{
            variation.glyphs.push(PUZZLE.glyphIncorrectSrc);

            this.puzzlesImgElem.src = PUZZLE.xSrc;

            // try to match as much of the PGN to the correct PGN
            const triedPGN = variation.toText(true).split(" ");

            // get the move index based on the number of correct PGNs
            let triedMoveIndex = 0;
            for (const correctSAN of puzzle.solution){
                if (correctSAN == triedPGN[0]){
                    triedPGN.shift();
                    triedMoveIndex++;
                }else{
                    break;
                }
            }

            // find the first mistake the user made
            const firstMistake = triedPGN.shift();

            // go through the refutation line
            let refutationLine = puzzle.responses[triedMoveIndex][firstMistake];

            if (!refutationLine)
                return;

            let refutationOffset = 0;
            for (let i = 0; i < triedPGN.length; i++){
                let refutation = refutationLine[refutationOffset];
                if (typeof refutation == "string" && refutation == triedPGN[i]){
                    // good, keep going
                    refutationOffset++;
                }else if (typeof refutation == "object" && refutation[triedPGN[i]]){
                    // we've reached a variation within the refutation line
                    refutationLine = refutation[triedPGN[i]];
                    refutationOffset = 0;
                }else{
                    // no response for this variation.
                    refutationOffset = -1;
                    break;
                }
            }

            // show the opponent's response, if exists
            if (refutationOffset > -1){
                this.playMove(refutationLine[refutationOffset]);
            }
        }
    }

    stop(){
        this.boardgfx.skeleton.removeEventListener("single-scroll", this.singleScrollListener);
        this.boardgfx.allowInputFrom[Piece.white] = true;
        this.boardgfx.allowInputFrom[Piece.black] = true;
    }

    save(){
        localStorage.setItem("puzzles_solved", this.puzzlesSolved.join(""));
    }

    playMove(san){
        setTimeout(() => {
            const move = gameState.state.getMoveOfSAN(san);
            gameState.makeMove(move);
            gameState.applyChanges();
        }, 800);
    }
}
