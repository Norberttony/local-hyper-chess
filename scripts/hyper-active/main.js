
// allows two-way communication between the wasm code and the worker
const channel = {
    input: "",
    output: "",

    addInput(txt){
        console.log("> ", txt);
        this.input += txt + "\n";
    },

    dropline(){
        this.input = this.input.substring(this.input.indexOf("\n") + 1);
    },

    C_readline(){
        if (this.input == "")
            this.input = "\n";
        const idx = this.input.indexOf("\n");
        const ptr = Module.stringToNewUTF8(this.input.substring(0, idx + 1));
        this.input = this.input.substring(idx + 1);
        return ptr;
    },

    msg(txt){
        console.log(txt);
        postMessage(txt);
    },

    flush(){
        this.msg(this.output.trim());
        this.output = "";
    }
}

// hook up the wasm code to the channel
var Module = {
    "print": (txt) => {
        console.log("PRINT: ", txt);
        postMessage(txt);
    }
};

console.log(this);

// import the JS glue code for the wasm
const workerUrl = location + "";
const basePath = workerUrl.replace(/\/[^/]+$/, '/');

importScripts(basePath + "/hyper-active.js");

setInterval(() => console.log("Heartbeat"), 1000);

onmessage = (e) => {
    channel.addInput(e.data);
}
