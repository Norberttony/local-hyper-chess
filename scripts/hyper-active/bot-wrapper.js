
// A wrapper class for communicating with a UCI-compliant Hyper Chess engine.

class HyperChessBot {
    constructor(path){
        this.workerPath = path;
        this.fen = "";
        this.board = new Board();
        this.running = false;

        this.start();
    }

    start(){
        if (this.worker)
            this.stop();

        this.worker = new Worker(this.workerPath);
        this.running = true;
        this.worker.onerror = (err) => {
            this.running = false;
            throw new Error(`Could not start hyper chess bot web worker: ${err.message}`);
        }
    }

    stop(){
        if (!this.worker)
            return;

        this.running = false;
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

    async uciready(){
    }

    // thinks for ms milliseconds, and then returns the best move.
    async thinkFor(ms){
        return new Promise((res, rej) => {
            let t = this;

            // a temporary hotfix, restart worker whenever it doesn't respond in time.
            const timeout = setTimeout(async () => {
                console.log("Hyper chess bot timed out, restarting...");
                this.restart();
                this.setFEN(this.fen);
                this.postMessage(`go movetime ${ms}`);
                t.worker.removeEventListener("message", listener);
                res(await this.thinkFor(ms));
            }, ms + 4000);

            function listener(event){
                if (event.data.startsWith("bestmove")){
                    clearTimeout(timeout);
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

    sendCmd(cmd){
        this.worker.postMessage(cmd);
    }

    read(callback){
        let t = this;

        function listener(event){
            if (callback(event.data))
                t.worker.removeEventListener("message", listener);
        }

        this.worker.addEventListener("message", listener);
    }

    playMove(san){
        const move = this.board.getMoveOfSAN(san);
        this.board.makeMove(move);
        this.worker.postMessage(`position moves ${move.uci}`);
    }
}
