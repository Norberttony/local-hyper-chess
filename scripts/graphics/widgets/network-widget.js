
// The network widget handles continuously updating the game with recent information from the server

class NetworkWidget extends BoardWidget {
    constructor(boardgfx, location = WIDGET_LOCATIONS.RIGHT){
        super(boardgfx);

        this.location = location;

        this.active = false;
        this.color = undefined;
        this.userJustMadeMove = false;

        // the server keeps track of ply count to determine whose turn it is, but this requires
        // offsetting it by 1 if a custom position with BTP was chosen.
        this.plyOffset = 0;

        this.lastUpdate = new Date();

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

            this.resignButton.addEventListener("click", () => {
                if (this.active && confirm("Are you sure you want to resign?"))
                    pollDatabase("POST", {
                        type: "resign",
                        gameId: this.gameId,
                        userId: this.userId,
                        rowNum: this.rowNum
                    });
            });
            this.drawButton.addEventListener("click", () => {
                if (this.active && confirm("Are you sure you want to offer a draw?"))
                    pollDatabase("POST", {
                        type: "draw",
                        gameId: this.gameId,
                        userId: this.userId,
                        rowNum: this.rowNum
                    });
            });
            this.takebackButton.addEventListener("click", () => {
                if (this.active && confirm("Are you sure you want to offer a takeback?")){
                    this.userJustMadeMove = false;
                    pollDatabase("POST", {
                        type: "takeback",
                        gameId: this.gameId,
                        userId: this.userId,
                        rowNum: this.rowNum
                    });
                }
            })
        }


        boardgfx.skeleton.addEventListener("single-scroll", (event) => {
            this.onSingleScroll(event);
        });
        boardgfx.skeleton.addEventListener("result", (event) => {
            this.onResult(event);
        });
    }

    enable(){
        this.activateGameControls();
        if (this.gameId)
            this.setActive();
    }

    disable(){
        this.activatePreGameControls();
        this.unsetActive();
    }

    setNetworkId(gameId, rowNum, userId, active = true){
        this.gameId = gameId;
        this.rowNum = rowNum;
        this.userId = userId;
        if (active)
            this.setActive();
        
        return this.refreshGame(active);
    }

    async startUpdate(){
        while (this.active){
            await this.getStatus();
            await sleep(1000);
        }
    }

    async getStatus(){
        if (!this.active)
            return;

        let rawData;
        try {
            console.log("Fetching from db");
            rawData = await pollDatabase("GET", {
                type: "gameStatus",
                gameId: this.gameId,
                rowNum: this.rowNum
            });
            console.log("Fetched.");
            this.boardgfx.finishedLoading();
        }
        catch(err){
            console.error("Failed to fetch game status. Check internet connection or database.");
            this.boardgfx.loading();
            return;
        }

        if (!this.active)
            return;
        
        if (new Date() - this.lastUpdate >= 60000){
            console.log("Refreshing game...");
            await this.refreshGame();
            // it is possible that rawData is now inaccurate.
            return;
        }

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
                    this.userJustMadeMove = false;
                    // must refresh the game by refetching it from the database
                    await this.refreshGame();
                }else if (plyCount - myPlyCount == 1){
                    this.userJustMadeMove = false;
                    this.boardgfx.addMoveToEnd(move);
                    this.boardgfx.applyChanges();
                    myPlyCount++;
                }else{
                    // verify that these moves are on the board. if not, maybe a takeback occurred, or
                    // some moves were deleted in place of new ones...
                    let cmpTo = this.boardgfx.mainVariation;
                    for (let i = 0; i < myPlyCount - plyCount; i++){
                        cmpTo = cmpTo.prev;
                    }

                    let isLastIter = i + 2 >= 2 * Math.floor(moves.length / 2);
                    let clientInterpolation = this.userJustMadeMove && myPlyCount - plyCount == 1;
                    if (cmpTo.san != move || isLastIter && myPlyCount != plyCount && !clientInterpolation){
                        // looks like they don't match.
                        this.boardgfx.deleteVariation(cmpTo);
                        this.boardgfx.addMoveToEnd(move);
                        this.boardgfx.applyChanges();
                    }
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

        this.lastUpdate = new Date();
    }

    async refreshGame(forceActive = false){
        this.boardgfx.loading();
        if (!this.gameId || !this.rowNum)
            return console.error("Cannot refresh game without gameId and rowNum"), this.boardgfx.finishedLoading();

        const gameInfo = await fetchGame(this.gameId, this.rowNum, this.userId);
        console.log("Refreshing game...", gameInfo);
        if (gameInfo.status == "err")
            throw new Error(gameInfo.msg);
        const { names, fen, color, moves, archived } = gameInfo;

        this.lastUpdate = new Date();

        if (names){
            let [ whiteName, blackName ] = names.split("_");
            if (color == "white" && whiteName == "Anonymous")
                whiteName = "You";
            else if (color == "black" && blackName == "Anonymous")
                blackName = "You";
            this.boardgfx.setNames(whiteName, blackName);
        }else if (color == "white" || color == "black"){
            this.boardgfx.setNames(color == "white" ? "You" : "Anonymous", color == "white" ? "Anonymous" : "You");
        }else{
            this.boardgfx.setNames("Anonymous (white)", "Anonymous (black)");
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

        if (color == "none"){
            delete this.color;
            this.activatePreGameControls();
            
        }else{
            this.color = color[0];
            this.activateGameControls();
        }

        // play out moves
        const movesString = moves.trim();
        const moveObjects = await gameLoader.doTask({ fen, moves: movesString });
        for (const m of moveObjects){
            const move = new Move(m.to, m.from, m.captures);
            this.boardgfx.makeMove(move, m.san);
        }
        this.boardgfx.applyChanges();

        // if archived skip to beginning
        if (archived){
            this.boardgfx.jumpToVariation(this.boardgfx.variationRoot);
            this.boardgfx.applyChanges();
            this.activatePreGameControls();
        }
        this.boardgfx.pgnData.setHeader("Event", "Hyper Chess Online Game");

        this.boardgfx.finishedLoading();

        return gameInfo;
    }

    setActive(){
        if (!this.active){
            this.active = true;
            this.lastUpdate = new Date();
            this.startUpdate();
        }
    }

    unsetActive(){
        if (this.active){
            this.active = false;
        }
    }

    activateGameControls(){
        if (this.location){
            this.resignButton.removeAttribute("disabled");
            this.drawButton.removeAttribute("disabled");
            this.takebackButton.removeAttribute("disabled");
        }
    }

    activatePreGameControls(){
        if (this.location && this.active){
            this.resignButton.setAttribute("disabled", "true");
            this.drawButton.setAttribute("disabled", "true");
            this.takebackButton.setAttribute("disabled", "true");
        }
    }

    // =========================== //
    // == HANDLING BOARD EVENTS == //
    // =========================== //

    onSingleScroll(event){
        if (!this.active)
            return;

        const { prevVariation, variation, userInput } = event.detail;

        if (!userInput)
            return;

        // ensure user is playing on main variation
        if (variation.isMain() && this.userId){
            // the move wasn't from this user. let's send it over to the other user.
            console.log("SEND MOVE TO USER", variation.san);
            this.userJustMadeMove = true;
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
    
        const { result, turn, termination, winner } = event.detail;
    
        // an on-board result will either be / or #, whereas a result from the server will either
        // be 1-0, 0-1, or 1/2-1/2. It is a bit confusing and likely needs reworking, but... this works
        if (result){
            pollDatabase("POST", {
                gameId: this.gameId,
                userId: this.userId,
                rowNum: this.rowNum,
                type: "result",
                result,
                termination: termination
            });
    
            this.boardgfx.allowInputFrom[Piece.white] = true;
            this.boardgfx.allowInputFrom[Piece.black] = true;
        }
    
        let resultText;
        switch(result){
            case "0-1":
                resultText = `Black won by ${termination}`;
                break;
            case "1/2-1/2":
                resultText = "Game ended in a draw";
                break;
            case "1-0":
                resultText = `White won by ${termination}`;
                break;
        }
    
        // did this player win?
        let mewin;
        if (result == "1/2-1/2"){
            mewin = "drew";
        }else if (this.color == "w" && result == "1-0" || this.color == "b" && result == "0-1"){
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
        this.activatePreGameControls();
    }
}
