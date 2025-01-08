
class WebPhilWidget extends BoardWidget {
    constructor(boardgfx){
        super(boardgfx, "Web Phil", WIDGET_LOCATIONS.BOARD);

        this.thinkTime = 1000;
        this.bot = new HyperChessBot("./scripts/hyper-active/main.js");
        this.playing = false;
        this.botName = "Web Phil";

        window.addEventListener("beforeunload", (event) => {
            if (this.playing)
                event.preventDefault();
        });

        const resignButton = getFirstElemOfClass(this.boardgfx.skeleton, "pgn-viewer__resign");
        if (resignButton){
            this.resignButton = resignButton;
            resignButton.addEventListener("click", () => {
                if (this.playing){
                    const result = this.userColor == Piece.white ? "0-1" : "1-0";
                    this.boardgfx.dispatchEvent("result", {
                        result,
                        termination: "resignation",
                        turn: this.boardgfx.state.turn
                    });
                    this.boardgfx.state.setResult(result, "resignation");
                }
            });
        }

        // board events
        boardgfx.skeleton.addEventListener("single-scroll", (event) => {
            this.onSingleScroll(event);
        });
        boardgfx.skeleton.addEventListener("result", (event) => {
            this.onResult(event);
        });
    }

    enable(){
        if (this.resignButton)
            this.resignButton.removeAttribute("disabled");
    }

    disable(){
        if (this.resignButton)
            this.resignButton.setAttribute("disabled", "true");
    }

    start(){
        if (this.playing)
            return;
    
        this.playing = true;
        this.startingFEN = this.boardgfx.state.getFEN();
        this.gameMoves = [];
    
        this.bot.startWorker();
        this.bot.setFEN(this.boardgfx.state.getFEN());
    
        // if not user's turn, it's web phil's turn!
        if (this.userColor != this.boardgfx.state.turn)
            this.bot.thinkFor(this.thinkTime).then(data => this.#botPlaysMove(data));
    }

    stop(){
        if (!this.playing)
            return;
    
        this.playing = false;
        this.bot.stopWorker();
    
        // clean up game state config
        this.boardgfx.allowVariations = true;
        this.boardgfx.allowInputFrom[Piece.white] = true;
        this.boardgfx.allowInputFrom[Piece.black] = true;
    }

    #botPlaysMove({ san }){
        if (!this.playing)
            return;

        this.gameMoves.push(san);
        if (!this.boardgfx.currentVariation.isMain() || this.boardgfx.currentVariation.next.length > 0){
            this.boardgfx.addMoveToEnd(san);
        }else{
            this.boardgfx.makeMove(this.boardgfx.state.getMoveOfSAN(san));
            this.boardgfx.applyChanges(false);
        }
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

        this.gameMoves.push(variation.san);
    
        this.bot.playMove(variation.san);
        this.bot.thinkFor(this.thinkTime).then(data => this.#botPlaysMove(data));
    }

    async onResult(event){
        if (!this.playing)
            return;

        let { result, turn, termination } = event.detail;

        if (result == "/"){
            result = "1/2 - 1/2";
        }else if (result == "#"){
            if (turn == Piece.white)
                result = "0-1";
            else
                result = "1-0";
        }

        if (this.gameMoves.length >= 20){
            const dbInfo = {
                type: "bot-game",
                fen: this.startingFEN,
                botColor: this.userColor == Piece.white ? "black" : "white",
                result,
                plyCount: this.gameMoves.length,
                moves: this.gameMoves.join(" ") + " " + result + " " + termination
            };
            const gameInfo = JSON.parse(await pollDatabase("POST", dbInfo));
            const [ gameId, rowNum ] = gameInfo.gameId.split("_");
            storeUserId(gameId, rowNum, gameInfo.userId);
            changeHash(`#game=${gameInfo.gameId}`);
        }

        this.stop();
        this.disable();
    }
}
