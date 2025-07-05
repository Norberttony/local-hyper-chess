
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
            depth
            <span class = "engine__depth"></span>
            (<span class = "engine__nps"></span>nps)
            <div class = "engine__pv">-</div>`;
        boardgfx.getWidgetElem(this.location).appendChild(container);

        this.container = container;

        this.setName();

        this.activeElem = this.container.getElementsByClassName("engine__active")[0];
        this.evalElem = this.container.getElementsByClassName("engine__eval")[0];
        this.pvElem = this.container.getElementsByClassName("engine__pv")[0];
        this.depthElem = this.container.getElementsByClassName("engine__depth")[0];
        this.npsElem = this.container.getElementsByClassName("engine__nps")[0];

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
                    this.evalElem.innerText = `#${sign}${Math.floor((score + 1) / 2)}`;
                }else{
                    console.error(`Did not recognize score type ${words[scoreIdx + 1]} from engine messsage ${data}`);
                }
            }

            // get pv
            const pvIdx = words.indexOf("pv");
            if (pvIdx > -1){
                const pv = words.splice(pvIdx + 1);

                const b = new Board();
                const state = this.boardgfx.state;
                b.loadFEN(state.getFEN());
                let fullmove = state.fullmove;
                let pvSan = state.turn == Piece.white ? "" : `${fullmove}... `;
                for (const m of pv){
                    const move = b.getMoveOfLAN(m);
                    if (b.turn == Piece.white)
                        pvSan += `${fullmove}. `
                    else
                        fullmove++;
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

            // get nps
            const nodesIdx = words.indexOf("nodes");
            const timeIdx = words.indexOf("time");
            if (nodesIdx > -1 && timeIdx > -1){
                const nodes = parseInt(words[nodesIdx + 1]);
                const time = parseInt(words[timeIdx + 1]);
                const nps = nodes / (time / 1000);

                // prefixes determined by every one thousand
                const prefixes = [ "", "k", "m", "g" ];
                const prefixIdx = Math.floor(Math.log(nps) / Math.log(1000));
                const nptime = (nps / Math.pow(1000, prefixIdx)).toPrecision(3);

                this.npsElem.innerText = `${nptime} ${prefixes[prefixIdx]}`;
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
