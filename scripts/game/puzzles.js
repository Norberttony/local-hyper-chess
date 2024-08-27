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
    id: 0
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

clearPuzzles();

function loadPuzzle(id){
    puzzlesImgElem.src = "";
    PUZZLE.id = id;

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

    puzzlesElem.style.display = "";

    containerElem.addEventListener("single-scroll", puzzleOnMadeMove);
    gameState.graphicalVariation = gameState.currentVariation;
}

function clearPuzzles(){
    // clear puzzle info
    puzzlesImgElem.src = "";
    puzzlesDiffElem.innerText = "";
    puzzlesSolvedElem.innerText = "";
    puzzlesTitleElem.innerText = "";
}

function stopSolvingPuzzle(){
    console.log("STOP SOLVING");
    // unlock board and stop listening for moves
    containerElem.removeEventListener("single-scroll", puzzleOnMadeMove);
    gameState.allowedSides[Piece.white] = true;
    gameState.allowedSides[Piece.black] = true;
}

function puzzleOnMadeMove(event){
    const { prevVariation, variation, userInput } = event.detail;

    console.log(userInput);

    if (!userInput)
        return;

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
        changeHash(`#puzzles=${id}`);
    }else{
        alert("You've solved all of the puzzles so far! Well done!");
    }
}

function nextPuzzle(){
    let nextId = (PUZZLE.id + 1) % PUZZLES.length;
    PUZZLE.id = nextId;
    changeHash(`#puzzles=${nextId}`);
}

function backPuzzle(){
    let backId = (PUZZLE.id - 1 + PUZZLES.length) % PUZZLES.length;
    PUZZLE.id = backId;
    changeHash(`#puzzles=${backId}`);
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
