
// A wrapper class for communicating with a UCI-compliant Hyper Chess engine.

class HyperChessBot {
    constructor(path){
        this.workerPath = path;
        this.thinking = false;
        this.fen = "";
        this.board = new Board();

        this.start();
    }

    start(){
        if (this.worker)
            this.stop();

        this.worker = new Worker(this.workerPath);
        this.worker.onerror = (err) => {
            throw new Error(`Could not start hyper chess bot web worker: ${err.message}`);
        }
    }

    stop(){
        if (!this.worker)
            return;

        this.worker.terminate();
    }

    // have you tried turning it off and on again?
    restart(){
        this.stop();
        this.start();
    }

    setFEN(fen){
        if (!this.worker)
            return;

        this.worker.postMessage(`position fen ${fen}`);
        this.board.loadFEN(fen);
    }

    // thinks for ms milliseconds, and then returns the best move.
    async thinkFor(ms){
        if (this.thinking)
            throw new Error("Cannot think about two positions simultaneously.");
        this.thinking = true;

        return new Promise((res, rej) => {
            let t = this;

            // a temporary hotfix, restart worker whenever it doesn't respond in time.
            const timeout = setTimeout(async () => {
                console.log("Hyper chess bot timed out, restarting...");
                this.restart();
                this.setFEN(this.fen);
                this.postMessage(`go movetime ${ms}`);
                this.thinking = false;
                t.worker.removeEventListener("message", listener);
                res(await this.thinkFor(ms));
            }, ms + 4000);

            function listener(event){
                if (event.data.startsWith("bestmove")){
                    clearTimeout(timeout);
                    t.thinking = false;
                    t.worker.removeEventListener("message", listener);

                    const lan = event.data.split(" ")[1].trim();
                    const move = t.board.getMoveOfLAN(lan);
                    if (move){
                        t.worker.postMessage(`position moves ${lan}`);
                        const san = getMoveSAN(t.board, move);
                        res(san);
                        t.board.makeMove(move);
                    }else{
                        console.warn(`Engine's choice of ${lan} does not exist as a valid move. Output was: ${event.data}`);
                    }
                }
            }

            this.worker.addEventListener("message", listener);
            this.worker.postMessage(`go movetime ${ms}`);
        });
    }

    playMove(san){
        const move = this.board.getMoveOfSAN(san);
        this.board.makeMove(move);
        this.worker.postMessage(`position moves ${move.uci}`);
    }
}
