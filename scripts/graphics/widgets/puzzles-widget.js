
class PuzzlesWidget extends BoardWidget {
    constructor(boardgfx){
        super(boardgfx);

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

        boardgfx.getWidgetElem(WIDGET_LOCATIONS.RIGHT).appendChild(puzzles);

        this.puzzlesElem       = getFirstElemOfClass(gameState.skeleton, "puzzles-widget");
        this.puzzlesTitleElem  = getFirstElemOfClass(gameState.skeleton, "puzzles-widget__title");
        this.puzzlesDiffElem   = getFirstElemOfClass(gameState.skeleton, "puzzles-widget__diff");
        this.puzzlesSolvedElem = getFirstElemOfClass(gameState.skeleton, "puzzles-widget__status");
        this.puzzlesImgElem    = getFirstElemOfClass(gameState.skeleton, "puzzles-widget__img");

        this.clear();
    }

    enable(){}

    disable(){}

    // clears current puzzle info
    clear(){
        this.puzzlesImgElem.src = "";
        this.puzzlesDiffElem.innerText = "";
        this.puzzlesSolvedElem.innerText = "";
        this.puzzlesTitleElem.innerText = "";
    }
}
