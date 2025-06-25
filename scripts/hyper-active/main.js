
// allows two-way communication between the wasm code and the worker
const channel = {
    input: "",
    output: "",

    addInput(txt){
        console.log("> ", txt);
        this.input += txt + "\n";
        Module.pauseAnalysis = 1;
    },

    unpause(){
        Module.pauseAnalysis = 0;
    },

    msg(txt){
        console.log(txt);
        postMessage(txt);
    },

    flush(){
        this.msg(this.output);
        this.output = "";
    }
}

// hook up the wasm code to the channel
var Module = {
    "onRuntimeInitialized": () => {
        // Module.ccall("main", "number", null, null, { async: true });
    },
    "preRun": [
        () => {
            Module.pauseAnalysis = 0;

            const lineBreak = "\n".charCodeAt(0);
            function input(){
                console.log("need input");
                if (channel.input.length == 0){
                    Module.pauseAnalysis = 0;
                    return lineBreak;
                }
                const c = channel.input[0];
                channel.input = channel.input.substring(1);
                return c.charCodeAt(0);
            }

            function output(code){
                console.log("outputting");
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

console.log(this);

// import the JS glue code for the wasm
const workerUrl = location + "";
const basePath = workerUrl.replace(/\/[^/]+$/, '/');

importScripts(basePath + "/hyper-active.js");

run();

setInterval(() => console.log("Heartbeat"), 1000);

onmessage = (e) => {
    channel.addInput(e.data);
}
