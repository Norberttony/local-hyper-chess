import { BoardWidget } from "hyper-chess-board/graphics/widgets/board-widget.js";
import { WebBotProcess } from "hyper-chess-board/engine/web/web-bot-process.js";
import { UCIBotProtocol } from "hyper-chess-board/engine/protocols/uci-protocol.js";
import { Side } from "hyper-chess-board/index.js";

import { changeHash } from "../../menus/menus.js";
import { pollDatabase, storeUserId } from "../../network/db-utils.js";
import { getFirstElemOfClass } from "../utils.js";

export class WebPhilWidget extends BoardWidget {
    constructor(boardgfx){
        super(boardgfx);

        this.thinkTime = 1000;
        this.bot = new WebBotProcess("./scripts/hyper-active/main.js");
        this.prot = new UCIBotProtocol(this.bot);
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
                    const result = this.userColor == Side.White ? "0-1" : "1-0";
                    const winner = this.userColor == Side.White ? Side.Black : Side.White;
                    this.boardgfx.dispatchEvent("result", {
                        result,
                        termination: "resignation",
                        turn: this.boardgfx.turn,
                        winner
                    });
                    this.boardgfx.setResult(result, "resignation", winner);
                }
            });
        }
        const drawButton = getFirstElemOfClass(this.boardgfx.skeleton, "pgn-viewer__draw");
        if (drawButton){
            this.drawButton = drawButton;
        }
        const takebackButton = getFirstElemOfClass(this.boardgfx.skeleton, "pgn-viewer__takeback");
        if (takebackButton){
            this.takebackButton = takebackButton;
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
        console.log("Enabled Web Phil");
        if (this.resignButton)
            this.resignButton.removeAttribute("disabled");
        if (this.drawButton)
            this.drawButton.setAttribute("disabled", "true");
        if (this.takebackButton)
            this.takebackButton.setAttribute("disabled", "true");
    }

    disable(){
        console.log("Disabled Web Phil");
        if (this.resignButton)
            this.resignButton.setAttribute("disabled", "true");
    }

    start(){
        if (this.playing)
            return;

        this.playing = true;
        this.startingFEN = this.boardgfx.getFEN();
        this.gameMoves = [];

        this.bot.start();
        this.prot.setFEN(this.boardgfx.getFEN());

        // if not user's turn, it's web phil's turn!
        if (this.userColor != this.boardgfx.turn)
            this.#botThink();
    }

    stop(){
        if (!this.playing)
            return;

        this.playing = false;
        this.bot.stop();

        // clean up game state config
        this.boardgfx.allowVariations = true;
        this.boardgfx.allowInputFrom[Side.White] = true;
        this.boardgfx.allowInputFrom[Side.Black] = true;
    }

    #botPlaysMove(san, lan){
        if (!this.playing)
            return;

        this.gameMoves.push(san);
        this.prot.playMove(lan);
        if (!this.boardgfx.currentVariation.isMain() || this.boardgfx.currentVariation.next.length > 0){
            this.boardgfx.addMoveToEnd(san);
        }else{
            this.boardgfx.playMove(this.boardgfx.getMoveOfSAN(san));
            this.boardgfx.applyChanges(false);
        }
    }

    #botThink(){
        this.prot.thinkForMoveTime(this.thinkTime).then(lan => {
            const move = this.boardgfx.getMoveOfLAN(lan);
            const san = this.boardgfx.getMoveSAN(move);
            this.#botPlaysMove(san, lan);
        });
    }

    // =========================== //
    // == HANDLING BOARD EVENTS == //
    // =========================== //

    onSingleScroll(event){
        if (!this.playing)
            return;
    
        const { variation, userInput } = event.detail;
    
        if (!userInput)
            return;
    
        // ensure user is making moves on the main variation itself
        if (variation.next.length > 0 || !variation.isMain())
            return;

        this.gameMoves.push(variation.san);
        this.prot.playMove(variation.move.lan);
        this.#botThink();
    }

    async onResult(event){
        if (!this.playing)
            return;

        const { result, termination } = event.detail;

        if (this.gameMoves.length >= 20){
            const dbInfo = {
                type: "bot-game",
                fen: this.startingFEN,
                botColor: this.userColor == Side.White ? "black" : "white",
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
