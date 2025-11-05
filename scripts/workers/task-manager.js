
export class TaskManager {
    constructor(workerPath, workersAmt = 1){
        this.workerPath = workerPath;
        this.workersAmt = workersAmt;
        this.workers = [];
        this.freeWorkers = [];
        this.tasks = [];

        for (let i = 0; i < this.workersAmt; i++){
            const w = new Worker(this.workerPath);
            this.workers.push(w);
            this.freeWorkers.push(w);
        }
    }

    doTask(data){
        return new Promise((res, rej) => {
            if (this.freeWorkers.length == 0){
                // queue tasks if no workers can take it
                this.tasks.push({ data, res, rej });
            }else{
                const worker = this.freeWorkers.pop();
                this.#promptWorker(worker, data, res, rej);
            }
        });
    }

    #freeWorker(worker){
        if (this.tasks.length == 0){
            this.freeWorkers.push(worker);
        }else{
            const task = this.tasks.shift();
            this.#promptWorker(worker, task.data, task.res, task.rej);
        }
    }

    #promptWorker(worker, data, res, rej){
        const t = this;
        function message(e){
            worker.removeEventListener("message", message);
            worker.removeEventListener("error", error);
            t.#freeWorker(worker);
            res(e.data);
        }

        function error(e){
            worker.removeEventListener("message", message);
            worker.removeEventListener("error", error);
            t.#freeWorker(worker);
            rej(e);
        }

        worker.addEventListener("message", message);
        worker.addEventListener("error", error);
        worker.postMessage(data);
    }
}
