// handles the client side of puzzles

const puzzlesElem = document.getElementById("puzzles");
const puzzlesTitleElem = document.getElementById("puzzles_title");
const puzzlesDiffElem = document.getElementById("puzzles_diff");
const puzzlesSolvedElem = document.getElementById("puzzles_solved");
const puzzlesImgElem = document.getElementById("puzzles_image");

const PUZZLE = {
    checkSrc:   "images/puzzles/checkmark.svg",
    xSrc:       "images/puzzles/x.svg",
    starSrc:    "images/puzzles/star.svg",
    id: -1
};

// global variables for puzzles
let userSide;
let oppSide;
let moveIndex;
let puzzle;

const puzzlesSolved = loadPuzzlesSolvedData();
// user might have missed new puzzles
while (puzzlesSolved.length < PUZZLES.length){
    puzzlesSolved.push("0");
}

// check if the URL indicates that a puzzle should be played.
clearPuzzles();
if (window.location.search.startsWith("?puzzle_id=")){
    // this relies on there being a single search parameter.
    const id = parseInt(window.location.search.substring(11));
    if (id !== NaN){
        PUZZLE.id = id;
        loadPuzzle(id);
    }
}

function loadPuzzle(id){
    document.getElementById("puzzles_rdm").innerText = "Click to return to the analysis board";

    if (puzzlesSolved[id] == "1"){
        puzzlesImgElem.src = PUZZLE.starSrc;
        puzzlesSolvedElem.innerText = "Solved";
    }else{
        puzzlesSolvedElem.innerText = "Unsolved";
    }

    puzzle = PUZZLES[id];

    // display stats
    puzzlesTitleElem.innerText = puzzle.title;
    puzzlesDiffElem.innerText = puzzle.difficulty;

    // load FEN
    gameState.loadFEN(puzzle.fen);

    // disallow moving for enemy side
    userSide = gameState.turn;
    oppSide = gameState.turn == Piece.white ? Piece.black : Piece.white;
    gameState.allowedSides[userSide] = true;
    gameState.allowedSides[oppSide] = false;

    // flip the board to the user's perspective
    setFlip(userSide == Piece.black);

    // add an observer that will listen for specific moves from the user
    moveIndex = 0; // index of currently expected move
    containerElem.addEventListener("single-scroll", puzzleOnMadeMove);

    puzzlesElem.style.display = "";
}

function clearPuzzles(){
    // clear puzzle info
    puzzlesImgElem.src = "";
    puzzlesDiffElem.innerText = "";
    puzzlesSolvedElem.innerText = "";
    puzzlesTitleElem.innerText = "";
}

function stopSolvingPuzzle(){
    // unlock board and stop listening for moves
    containerElem.removeEventListener("single-scroll", puzzleOnMadeMove);
    gameState.allowedSides[Piece.white] = true;
    gameState.allowedSides[Piece.black] = true;
}

function puzzleOnMadeMove(event){
    const { prevVariation, variation, userInput } = event.detail;

    if (!userInput)
        return;

    // we don't make moves for the user
    if (gameState.board.turn == userSide){
        return;
    }

    let pgn = removeGlyphs(variation.san);
    const correctMove = puzzle.solution[moveIndex];

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
        removeGlyphs(variation.prev.prev.san) == puzzle.solution[moveIndex - 2];

    if (isCorrectMove && correctVariation){
        moveIndex++;
        puzzlesImgElem.src = PUZZLE.checkSrc;
        
        // play opponent's next move
        if (moveIndex < puzzle.solution.length){
            puzzlePlayMove(puzzle.solution[moveIndex]);
            moveIndex++;
        }else{
            // check if finished puzzle
            puzzlesImgElem.src = PUZZLE.starSrc;
            puzzlesSolvedElem.innerText = "Solved";
            puzzlesSolved[PUZZLE.id] = "1";
            savePuzzlesSolvedData(puzzlesSolved);
            stopSolvingPuzzle();
        }
    }else{
        puzzlesImgElem.src = PUZZLE.xSrc;

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
            puzzlePlayMove(refutationLine[refutationOffset]);
        }
    }
}

function puzzlePlayMove(san){
    setTimeout(() => {
        const move = gameState.board.getMoveOfSAN(san);
        gameState.makeMove(move);
        gameState.applyChanges();
    }, 800);
}

function randomPuzzle(){
    if (!puzzle){
        let unsolvedPuzzlesAmt = 0;
        for (const a of puzzlesSolved){
            if (a == 0)
                unsolvedPuzzlesAmt++;
        }
        if (unsolvedPuzzlesAmt > 0){
            let unsolvedNum = Math.floor(Math.random() * unsolvedPuzzlesAmt);
            let id = 0;
            for (let i = 0; i < puzzlesSolved.length; i++){
                if (puzzlesSolved[i] == 0)
                unsolvedNum--;
                if (unsolvedNum < 0){
                    break;
                }
                id++;
            }
            window.location.search = `?puzzle_id=${id}`;
        }else{
            alert("You've solved all of the puzzles so far! Well done!");
        }
    }else{
        // return back to the analysis  board
        window.location.search = "";
    }
}

function nextPuzzle(){
    let nextId = (PUZZLE.id + 1) % PUZZLES.length;
    window.location.search = `?puzzle_id=${nextId}`;
}

function backPuzzle(){
    let backId = (PUZZLE.id - 1 + PUZZLES.length) % PUZZLES.length;
    window.location.search = `?puzzle_id=${backId}`;
}

function loadPuzzlesSolvedData(){
    const puzzlesSolved = localStorage.getItem("puzzles_solved");
    if (puzzlesSolved){
        return puzzlesSolved.split("");
    }
    return [];
}

function savePuzzlesSolvedData(data){
    localStorage.setItem("puzzles_solved", data.join(""));
}

containerElem.addEventListener("loadFEN", stopSolvingPuzzle);
