
// allows two-way communication between the wasm code and the worker
const channel = {
    input: "",
    output: "",

    addInput(txt){
        this.input += txt + "\n";
    },

    msg(txt){
        postMessage(txt);
    },

    flush(){
        console.log(this.output);
        if (this.output.startsWith("bestmove"))
            this.msg(this.output);
        this.output = "";
    }
}

// hook up the wasm code to the channel
var Module = {
    "onRuntimeInitialized": () => {
        Module.ccall("main", "number", null, null);
    },
    "preRun": [
        () => {
            const lineBreak = "\n".charCodeAt(0);
            function input(){
                if (channel.input.length == 0)
                    return lineBreak;
                const c = channel.input[0];
                channel.input = channel.input.substring(1);
                return c.charCodeAt(0);
            }

            function output(code){
                const char = String.fromCharCode(code);
                channel.output += char;
                if (char == "\n")
                    channel.flush();
            }

            console.log("FS init");
            Module.FS.init(input, output, output);
        }
    ],
    "print": () => 0
};

// import the JS glue code for the wasm
const workerUrl = location + "";
const basePath = workerUrl.replace(/\/[^/]+$/, '/');

importScripts(basePath + "/hyper-active.js");

run();

// setInterval(() => console.log("Heartbeat"), 100);

onmessage = (e) => {
    channel.addInput(e.data);
}
