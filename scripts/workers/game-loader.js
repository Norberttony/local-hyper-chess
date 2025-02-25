
// retrieving every move based on its SAN/PGN can be an extremely time-consuming process, as it is
// not easily machine-readable. Instead of reformatting the entire database to use a more efficient
// scheme, the move objects are generated using this gameLoader instance.
const gameLoader = new TaskManager("./scripts/workers/final-pos-worker.js", 2);
