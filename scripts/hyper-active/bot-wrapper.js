
// A wrapper class that handles easily modifying the bot's internal state.

class HyperChessBot {
    constructor(path){
        this.workerPath = path;
        this.thinking = false;
        this.fen = "";

        this.startWorker();
    }

    startWorker(){
        if (this.worker)
            this.stopWorker();

        this.worker = new Worker(this.workerPath);
        this.worker.onerror = (err) => {
            throw new Error(`Could not start hyper chess bot web worker: ${err.message}`);
        }
        this.worker.addEventListener("message", (event) => {
            if (event.data.cmd == "update-fen")
                this.fen = event.data.fen;
        });
    }

    stopWorker(){
        if (!this.worker)
            return;

        this.worker.terminate();
    }

    restartWorker(){
        this.stopWorker();
        this.startWorker();
    }

    setFEN(fen){
        if (!this.worker)
            return;

        this.worker.postMessage({ cmd: "fen", fen });
    }

    // thinks for ms milliseconds, and then returns the best move.
    thinkFor(ms){
        if (this.thinking)
            throw new Error("Cannot think about two positions simultaneously.");
        this.thinking = true;

        return new Promise((res, rej) => {
            let t = this;

            // a temporary hotfix, restart worker whenever it doesn't respond in time.
            const timeout = setTimeout(async () => {
                console.log("Hyper chess bot timed out, restarting...");
                this.restartWorker();
                this.setFEN(this.fen);
                this.thinking = false;
                t.worker.removeEventListener("message", listener);
                res(await this.thinkFor(ms));
            }, ms + 4000);

            function listener(event){
                if (event.data.cmd == "searchFinished"){
                    clearTimeout(timeout);
                    t.thinking = false;
                    t.worker.removeEventListener("message", listener);
                    res(event.data);
                }
            }

            this.worker.addEventListener("message", listener);
            this.worker.postMessage({ cmd: "search", thinkTime: ms });
        });
    }

    playMove(san){
        this.worker.postMessage({ cmd: "move", san });
    }
}
