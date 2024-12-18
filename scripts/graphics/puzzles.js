
// handles the client side of puzzles

// while this would make sense as a widget, for now just hardcode it to the main board.
{
    const puzzles = document.createElement("div");
    puzzles.classList.add("puzzles-widget");
    puzzles.innerHTML = `
        <div class = "puzzles-widget__img-container">
            <img class = "puzzles-widget__img" src = "">
        </div>
        <div class = "puzzles-widget__controls">
            <button class = "puzzles-widget__back" onclick = "backPuzzle();">&lt;</button>
            <button class = "puzzles-widget__rdm" onclick = "randomPuzzle();">Click to go to a random puzzle</button>
            <button class = "puzzles-widget__next" onclick = "nextPuzzle();">&gt;</button>
        </div>
        <div class = "puzzles-widget__title">TITLE</div>
        <div class = "puzzles-widget__diff">Intermediate</div>
        <div class = "puzzles-widget__status">Unsolved</div>`;

    gameState.getWidgetElem(WIDGET_LOCATIONS.RIGHT).appendChild(puzzles);
}


const puzzlesElem       = getFirstElemOfClass(gameState.skeleton, "puzzles-widget");
const puzzlesTitleElem  = getFirstElemOfClass(gameState.skeleton, "puzzles-widget__title");
const puzzlesDiffElem   = getFirstElemOfClass(gameState.skeleton, "puzzles-widget__diff");
const puzzlesSolvedElem = getFirstElemOfClass(gameState.skeleton, "puzzles-widget__status");
const puzzlesImgElem    = getFirstElemOfClass(gameState.skeleton, "puzzles-widget__img");

const PUZZLE = {
    checkSrc:   "images/puzzles/checkmark.svg",
    xSrc:       "images/puzzles/x.svg",
    starSrc:    "images/puzzles/star.svg",
    id: 0,

    glyphCorrectSrc: "images/glyphs/correct.svg",
    glyphIncorrectSrc: "images/glyphs/incorrect.svg"
};

let PUZZLES;

// global variables for puzzles
let userSide;
let oppSide;
let moveIndex;
let puzzle;

const puzzlesSolved = loadPuzzlesSolvedData();

clearPuzzles();

async function loadPuzzle(id){
    if (!PUZZLES)
        await fetchPuzzleData();

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
    userSide = gameState.state.turn;
    oppSide = gameState.state.turn == Piece.white ? Piece.black : Piece.white;
    gameState.allowInputFrom[userSide] = true;
    gameState.allowInputFrom[oppSide] = false;

    // flip the board to the user's perspective
    gameState.setFlip(userSide == Piece.black);

    // add an observer that will listen for specific moves from the user
    moveIndex = 0; // index of currently expected move

    puzzlesElem.style.display = "";

    gameState.skeleton.addEventListener("single-scroll", puzzleOnMadeMove);
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
    gameState.skeleton.removeEventListener("single-scroll", puzzleOnMadeMove);
    gameState.allowInputFrom[Piece.white] = true;
    gameState.allowInputFrom[Piece.black] = true;
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
        variation.glyphs.push(PUZZLE.glyphCorrectSrc);

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
        variation.glyphs.push(PUZZLE.glyphIncorrectSrc);

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
        const move = gameState.state.getMoveOfSAN(san);
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

async function nextPuzzle(){
    if (!PUZZLES)
        await fetchPuzzleData();

    let nextId = (PUZZLE.id + 1) % PUZZLES.length;
    PUZZLE.id = nextId;
    changeHash(`#puzzles=${nextId}`);
}

async function backPuzzle(){
    if (!PUZZLES)
        await fetchPuzzleData();

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

async function fetchPuzzleData(){
    if (!PUZZLES){
        showDialogBox("Fetching puzzles", "The puzzles are being fetched from the database, please wait...");
        
        PUZZLES = tabulateData(await pollDatabase("GET", { type: "puzzles" }));

        // user might have missed new puzzles
        while (puzzlesSolved.length < PUZZLES.length){
            puzzlesSolved.push("0");
        }

        hideDialogBox();
    }
}
