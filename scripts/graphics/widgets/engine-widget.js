
class EngineWidget extends BoardWidget {
    constructor(boardgfx){
        super(boardgfx, "engine", WIDGET_LOCATIONS.RIGHT);

        console.log(this);

        this.engine = new HyperChessBot("./scripts/hyper-active/main.js");

        const container = document.createElement("div");
        container.classList.add("board-graphics__engine");
        container.innerHTML = `
            <input class = "engine__active" type = "checkbox">
            <span class = "engine__eval">-</span>
            <span class = "engine__name">Hyper Chess Engine</span>
            at depth
            <span class = "engine__depth"></span>
            <div class = "engine__pv">-</div>`;
        boardgfx.getWidgetElem(this.location).appendChild(container);

        this.container = container;

        this.setName();

        this.activeElem = this.container.getElementsByClassName("engine__active")[0];
        this.evalElem = this.container.getElementsByClassName("engine__eval")[0];
        this.pvElem = this.container.getElementsByClassName("engine__pv")[0];
        this.depthElem = this.container.getElementsByClassName("engine__depth")[0];

        this.activeElem.addEventListener("change", (event) => {
            if (event.target.checked){
                this.enable();
            }else{
                this.disable();
            }
        });

        boardgfx.skeleton.addEventListener("variation-change", (event) => {
            this.startThinking();
        });
    }

    enable(){
        this.activeElem.checked = true;

        this.setName();

        this.engine.start();

        this.engine.read((data) => {
            console.log(data);
            const words = data.trim().split(" ");

            // get eval
            const scoreIdx = words.indexOf("score");
            if (scoreIdx > -1){
                const isWTP = this.boardgfx.state.turn == Piece.white;
                const score = (isWTP ? 1 : -1) * parseInt(words[scoreIdx + 2]);
                const sign = score > 0 ? "+" : "";
                
                if (words[scoreIdx + 1] == "cp"){
                    this.evalElem.innerText = `${sign}${(score / 100).toFixed(1)}`;
                }else if (words[scoreIdx + 1] == "mate"){
                    this.evalElem.innerText = `#${sign}${score}`;
                }else{
                    console.error(`Did not recognize score type ${words[scoreIdx + 1]} from engine messsage ${data}`);
                }
            }

            // get pv
            const pvIdx = words.indexOf("pv");
            if (pvIdx > -1){
                const pv = words.splice(pvIdx + 1);
                let pvSan = "";

                const b = new Board();
                b.loadFEN(this.boardgfx.state.getFEN());
                for (const m of pv){
                    const move = b.getMoveOfLAN(m);
                    pvSan += getMoveSAN(b, move) + " ";
                    b.makeMove(move);
                }

                this.pvElem.innerText = pvSan;
            }

            // get depth
            const depthIdx = words.indexOf("depth");
            if (depthIdx > -1){
                this.depthElem.innerText = words[depthIdx + 1];
            }
        });

        this.startThinking();
    }

    disable(){
        this.activeElem.checked = false;

        if (!this.engine.running)
            return;

        this.engine.stop();
    }

    startThinking(){
        console.log(this.engine);
        if (this.engine.running){
            this.engine.sendCmd("stop");
            this.engine.sendCmd(`position fen ${this.boardgfx.state.getFEN()}`);
            this.engine.sendCmd("go");
        }
    }

    setName(){
        const nameElem = this.container.getElementsByClassName("engine__name")[0];

        this.engineName = undefined;
        this.engine.start();
        this.engine.read((data) => {
            // splitting into words means the code does not stumble on extra whitespace
            const words = data.trim().split(" ");
            if (words[0] == "id" && words[1] == "name"){
                words.splice(0, 2);
                this.engineName = words.join(" ");
            }else if (words[0] == "uciok"){
                nameElem.innerText = this.engineName;
                this.engine.stop();
                return true;
            }
        });
        this.engine.sendCmd("uciready");
    }
}
