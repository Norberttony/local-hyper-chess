
class WebPhilWidget extends BoardWidget {
    constructor(boardgfx){
        super(boardgfx, "Web Phil", WIDGET_LOCATIONS.BOARD);

        const form = document.createElement("form");
        form.classList.add("board-graphics__web-phil");
        form.innerHTML = `
            <label for = "phil_color">You play as:</label>
            <div>
                <input name = "phil_color" type = "radio" value = "white" checked = true> White
            </div>
            <div>
                <input name = "phil_color" type = "radio" value = "black"> Black
            </div>
            <input value = "Start Game" type = "submit">`;

        boardgfx.skeleton.appendChild(form);

        this.thinkTime = 1000;
        this.worker = undefined;
        this.playing = false;

        // user starts game against web phil
        form.addEventListener("submit", (event) => {
            event.preventDefault();

            form.style.display = "none";
            const playAs = form.phil_color.value == "white" ? Piece.white : Piece.black;

            this.userColor = playAs;
            boardgfx.allowInputFrom[Piece.white] = false;
            boardgfx.allowInputFrom[Piece.black] = false;
            boardgfx.allowInputFrom[playAs] = true;

            boardgfx.setFlip(playAs == Piece.black);

            this.start();
        });
        window.addEventListener("beforeunload", (event) => {
            if (this.playing)
                event.preventDefault();
        });

        // board events
        boardgfx.skeleton.addEventListener("single-scroll", (event) => {
            this.onSingleScroll(event);
        });
    }

    start(){
        if (this.playing)
            return;
    
        this.playing = true;
    
        const phil = new Worker("./scripts/hyper-active/main.js");
        this.worker = phil;
        
        phil.onmessage = (e) => {
            if (!this.playing)
                return;
    
            const { cmd, val, san, depth } = e.data;
    
            console.log(`Web Phil believes his position is valued at ${val} after calculating to a depth of ${depth} ply.`);
            console.log(san);
    
            if (cmd == "searchFinished"){
                if (!this.boardgfx.currentVariation.isMain() || this.boardgfx.currentVariation.next.length > 0){
                    this.boardgfx.addMoveToEnd(san);
                }else{
                    this.boardgfx.makeMove(this.boardgfx.state.getMoveOfSAN(san));
                    this.boardgfx.applyChanges(false);
                }
            }
        }
    
        phil.postMessage({ cmd: "fen", fen: this.boardgfx.state.getFEN() });
    
        // if not user's turn, it's web phil's turn!
        if (this.userColor != this.boardgfx.state.turn)
            this.worker.postMessage({ cmd: "search", thinkTime: this.thinkTime });
    }

    stop(){
        if (!this.playing)
            return;
    
        this.playing = false;
        this.worker.terminate();
    
        // clean up game state config
        this.boardgfx.allowVariations = true;
        this.boardgfx.allowedSides[Piece.white] = true;
        this.boardgfx.allowedSides[Piece.black] = true;
    }

    // =========================== //
    // == HANDLING BOARD EVENTS == //
    // =========================== //

    onSingleScroll(event){
        if (!this.playing)
            return;
    
        const { prevVariation, variation, userInput } = event.detail;
    
        if (!userInput)
            return;
    
        // ensure user is making moves on the main variation itself
        if (variation.next.length > 0 || !variation.isMain())
            return;
    
        this.worker.postMessage({ cmd: "move", san: variation.san });
        this.worker.postMessage({ cmd: "search", thinkTime: this.thinkTime });
    }
}
