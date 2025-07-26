
import { BoardWidget } from "./board-widget.mjs";

// technically takes up two locations at once but oh well

export class PlayersWidget extends BoardWidget {
    constructor(boardgfx){
        super(boardgfx);

        const topPlyr = document.createElement("div");
        topPlyr.classList.add("board-graphics__top-player");
        boardgfx.getWidgetElem(WIDGET_LOCATIONS.TOP_BAR).appendChild(topPlyr);

        const bottomPlyr = document.createElement("div");
        bottomPlyr.classList.add("board-graphics__bottom-player");
        boardgfx.getWidgetElem(WIDGET_LOCATIONS.BOTTOM_BAR).appendChild(bottomPlyr);

        this.topPlyr = topPlyr;
        this.bottomPlyr = bottomPlyr;

        // whenever the board flips, update the player names.
        boardgfx.skeleton.addEventListener("player-names", (event) => {
            const { whiteName, blackName } = event.detail;
            this.setNames(whiteName, blackName);
        });
        boardgfx.skeleton.addEventListener("flip", () => {
            const temp = topPlyr.innerText;
            topPlyr.innerText = bottomPlyr.innerText;
            bottomPlyr.innerText = temp;
        });
    }

    disable(){
        this.topPlyr.style.display = "none";
        this.bottomPlyr.style.display = "none";
    }

    enable(){
        this.topPlyr.style.display = "";
        this.bottomPlyr.style.display = "";
    }

    setNames(white, black){
        if (!this.boardgfx.isFlipped){
            this.topPlyr.innerText = black;
            this.bottomPlyr.innerText = white;
        }else{
            this.topPlyr.innerText = white;
            this.bottomPlyr.innerText = black;
        }
    }
}
