
// The network widget handles continuously updating the game with recent information from the server

class NetworkWidget extends BoardWidget {
    constructor(boardgfx, location = WIDGET_LOCATIONS.RIGHT){
        super(boardgfx, "Network", location);

        this.active = false;
        this.color = undefined;

        // the server keeps track of ply count to determine whose turn it is, but this requires
        // offsetting it by 1 if a custom position with BTP was chosen.
        this.plyOffset = 0;

        if (location != WIDGET_LOCATIONS.NONE){
            const container = document.createElement("div");

            const gameButtons = document.createElement("div");
            gameButtons.classList.add("pgn-viewer__game-controls");
            gameButtons.innerHTML = `
                <button class = "pgn-viewer__flip font-icon" data-icon = "" onclick = "gameState.flip();"></button>
                <button class = "pgn-viewer__resign font-icon" data-icon = "" id = "panel_resign"></button>
                <button class = "pgn-viewer__draw"><span>½</span></button>
                <button class = "pgn-viewer__takeback font-icon" data-icon = "" id = "panel_takeback" disabled></button>`;
            container.appendChild(gameButtons);

            const outputElem = document.createElement("output");
            container.appendChild(outputElem);

            boardgfx.getWidgetElem(location).appendChild(container);

            this.resignButton = getFirstElemOfClass(gameButtons, "pgn-viewer__resign");
            this.drawButton = getFirstElemOfClass(gameButtons, "pgn-viewer__draw");
            this.takebackButton = getFirstElemOfClass(gameButtons, "pgn-viewer__takeback");
            this.outputElem = outputElem;

            this.resignButton.onclick = () => {
                if (confirm("Are you sure you want to resign?"))
                    pollDatabase("POST", {
                        type: "resign",
                        gameId: this.gameId,
                        userId: this.userId,
                        rowNum: this.rowNum
                    });
            }
            this.drawButton.onclick = () => {
                if (confirm("Are you sure you want to offer a draw?"))
                    pollDatabase("POST", {
                        type: "draw",
                        gameId: this.gameId,
                        userId: this.userId,
                        rowNum: this.rowNum
                    });
            }
        }


        boardgfx.skeleton.addEventListener("single-scroll", (event) => {
            this.onSingleScroll(event);
        });
        boardgfx.skeleton.addEventListener("result", (event) => {
            this.onResult(event);
        });
    }

    enable(){
        if (this.location){
            this.resignButton.removeAttribute("disabled");
            this.drawButton.removeAttribute("disabled");
            this.takebackButton.removeAttribute("disabled");
        }
        this.active = true;
    }

    disable(){
        if (this.location){
            this.resignButton.setAttribute("disabled", "true");
            this.drawButton.setAttribute("disabled", "true");
            this.takebackButton.setAttribute("disabled", "true");
        }
        this.active = false;
    }

    async setNetworkId(gameId, rowNum, userId){
        this.gameId = gameId;
        this.rowNum = rowNum;
        this.userId = userId;
        return await this.refreshGame();
    }

    async startUpdate(){
        this.active = true;
        while (this.active){
            await this.getStatus();
            await sleep(1000);
        }
    }

    async getStatus(){
        if (!this.active)
            return;

        const rawData = await pollDatabase("GET", {
            type: "gameStatus",
            gameId: this.gameId,
            rowNum: this.rowNum
        });

        if (!this.active)
            return;

        const gameInfo = JSON.parse(JSON.parse(rawData).results);

        // play any moves that may have occurred
        if (gameInfo.recentMoves){
            let myPlyCount = this.boardgfx.mainVariation.level + this.plyOffset;

            const moves = gameInfo.recentMoves.split(" ");
            for (let i = 0; i < 2 * Math.floor(moves.length / 2); i += 2){
                const plyCount = parseInt(moves[i]);
                const move = moves[i + 1];

                if (plyCount - myPlyCount > 1){
                    // must refresh the game by refetching it from the database
                }else if (plyCount - myPlyCount == 1){
                    this.boardgfx.addMoveToEnd(move);
                    this.boardgfx.applyChanges();
                    myPlyCount++;
                }
            }
        }

        // display any active offers
        if (gameInfo.offers && this.outputElem){
            const validOffers = [ "draw", "takeback", "rematch" ];

            this.outputElem.innerText = "";

            for (let i = 0; i < validOffers.length; i++){
                if (gameInfo.offers[i] == "n")
                    continue;

                let offerer;
                if (!this.color){
                    offerer = gameInfo.offers[i] == "w" ? "White" : "Black";
                }else{
                    offerer = gameInfo.offers[i] == this.color ? "You" : "Your opponent";
                }

                this.outputElem.innerText += `${offerer} offered a ${validOffers[i]}\n`;
            }
        }

        // any not-on-board result may have occurred
        if (gameInfo.result){
            this.boardgfx.dispatchEvent("result", {
                result: gameInfo.result,
                turn: this.boardgfx.state.turn,
                termination: gameInfo.termination
            });
        }
    }

    async refreshGame(){
        this.boardgfx.loading();
        if (!this.gameId || !this.rowNum)
            return console.error("Cannot refresh game without gameId and rowNum"), this.boardgfx.finishedLoading();

        const gameInfo = await fetchGame(this.gameId, this.rowNum, this.userId);
        const { names, fen, color, moves, archived } = gameInfo;

        if (names){
            let [ whiteName, blackName ] = names.split("_");
            if (color == "white" && whiteName == "Anonymous")
                whiteName = "You";
            else if (color == "black" && blackName == "Anonymous")
                blackName = "You";
            this.boardgfx.setNames(whiteName, blackName);
        }

        this.boardgfx.loadFEN(fen);
        this.boardgfx.setFlip(color == "black");
        
        // only allow input from user's side
        this.boardgfx.allowInputFrom[Piece.white] = false;
        this.boardgfx.allowInputFrom[Piece.black] = false;
        if (color == "black")
            this.boardgfx.allowInputFrom[Piece.black] = true;
        else if (color == "white")
            this.boardgfx.allowInputFrom[Piece.white] = true;

        // play out moves
        const movesSplit = moves.split(" ");
        let res;
        let term;
        for (const m of movesSplit){
            if (m != ""){
                if (m.startsWith("1-0") || m.startsWith("0-1") || m.startsWith("1/2-1/2")){
                    res = m;
                    term = movesSplit[movesSplit.length - 1];
                    break;
                }else{
                    const move = this.boardgfx.state.getMoveOfSAN(m);
                    this.boardgfx.makeMove(move);
                }
            }
        }
        this.boardgfx.applyChanges();

        if (color == "none"){
            delete this.color;
            activatePreGameControls();
        }else{
            this.color = color[0];
            activateGameControls();
        }

        // if archived skip to beginning
        if (archived){
            this.boardgfx.jumpToVariation(this.boardgfx.variationRoot);
            this.boardgfx.applyChanges();
            activatePreGameControls();
        }
        this.boardgfx.pgnData.setHeader("Event", "Hyper Chess Online Game");

        this.boardgfx.finishedLoading();

        this.startUpdate();

        return gameInfo;
    }

    // =========================== //
    // == HANDLING BOARD EVENTS == //
    // =========================== //

    onSingleScroll(event){
        const { prevVariation, variation, userInput } = event.detail;

        if (!userInput)
            return;

        // ensure user is playing on main variation
        if (variation.isMain() && this.userId){
            // the move wasn't from this user. let's send it over to the other user.
            console.log("SEND MOVE TO USER", variation.san);
            pollDatabase("POST", {
                type: "move",
                gameId: this.gameId,
                userId: this.userId,
                rowNum: this.rowNum,
                move: variation.san
            });
        }
    }

    onResult(event){
        if (!this.active)
            return;

        this.active = false;
    
        const { result, turn, termination } = event.detail;
    
        // get result text of game
        let resultNum;
        if      (result == "0-1" || (result == "#" && turn == Piece.white))
            resultNum = -1;
        else if (result == "1-0" || (result == "#" && turn == Piece.black))
            resultNum = 1;
        else
            resultNum = 0;
    
        // an on-board result will either be / or #, whereas a result from the server will either
        // be 1-0, 0-1, or 1/2-1/2. It is a bit confusing and likely needs reworking, but... this works
        if (result){
            let resultText;
    
            if (resultNum == -1){
                resultText = "0-1";
            }else if (resultNum == 1){
                resultText = "1-0";
            }else{
                resultText = "1/2-1/2";
            }
    
            pollDatabase("POST", {
                gameId: this.gameId,
                userId: this.userId,
                rowNum: this.rowNum,
                type: "result",
                result: resultText,
                termination: termination
            });
    
            this.boardgfx.allowInputFrom[Piece.white] = true;
            this.boardgfx.allowInputFrom[Piece.black] = true;
        }
    
        let resultText;
        switch(resultNum){
            case -1:
                resultText = `Black won by ${termination}`;
                break;
            case 0:
                resultText = "Game ended in a draw";
                break;
            case 1:
                resultText = `White won by ${termination}`;
                break;
        }
    
        // did this player win?
        let mewin;
        if (resultNum == 0){
            mewin = "drew";
        }else if (this.color == "w" && resultNum == 1 || this.color == "b" && resultNum == -1){
            mewin = "won";
        }else{
            mewin = "lost";
        }
    
        // avoid displaying the local result for spectating games
        if (!this.color)
            document.getElementById("result-box_local").style.display = "none";
        else
            document.getElementById("result-box_local").style.display = "";
    
        this.boardgfx.pgnData.setHeader("Termination", termination);
    
        displayResultBox(resultText, mewin, termination);
        activatePreGameControls();
    }
}
