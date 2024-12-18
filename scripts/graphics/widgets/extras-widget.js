
// Allows user to copy or set the FEN or PGN

class ExtrasWidget extends BoardWidget {
    constructor(boardgfx, location = WIDGET_LOCATIONS.BOTTOM){
        super(boardgfx, "Extras", location);

        const container = document.createElement("div");
        container.classList.add("board-graphics__extras");
        container.innerHTML = `
            <textarea class = "extras__pgn" onfocus = "this.select();" spellcheck = "false"></textarea>
            <button class = "extras__set-pgn-button" onclick = "setPGN();">Set PGN</button>
            <input class = "extras__fen" onfocus = "this.select();">
            <button class = "extras__set-fen-button" onclick = "setFEN();" spellcheck = "false">Set FEN</button>`;
        boardgfx.getWidgetElem(location).appendChild(container);

        const pgnText = getFirstElemOfClass(container, "extras__pgn");
        const fenText = getFirstElemOfClass(container, "extras__fen");

        this.boardgfx = boardgfx;
        this.pgnText = pgnText;
        this.fenText = fenText;
        this.pgnButton = getFirstElemOfClass(container, "extras__set-pgn-button");
        this.fenButton = getFirstElemOfClass(container, "extras__set-fen-button");

        this.updateFENText();
        this.updatePGNText();

        // clicking buttons
        this.pgnButton.onclick = () => {
            boardgfx.loadPGN(pgnText.value);
        }
        this.fenButton.onclick = () => {
            boardgfx.loadFEN(fenText.value);
        }

        // listening to game state events
        boardgfx.skeleton.addEventListener("variation-change", () => this.updateFENText());
        boardgfx.skeleton.addEventListener("loadFEN", () => this.updateFENText() + this.updatePGNText());
        boardgfx.skeleton.addEventListener("new-variation", () => this.updatePGNText());
    }

    enable(){
        this.pgnButton.removeAttribute("disabled");
        this.fenButton.removeAttribute("disabled");
    }

    disable(){
        this.pgnButton.setAttribute("disabled", "true");
        this.fenButton.setAttribute("disabled", "true");
    }

    updateFENText(){
        this.fenText.value = this.boardgfx.state.getFEN();
    }

    updatePGNText(){
        this.pgnText.value = this.boardgfx.pgnData.toString();
    }
}
