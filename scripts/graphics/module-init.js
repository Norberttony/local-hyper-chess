
const module_loader = new Module_Loader();

(async () => {

    // makes the assumption that this is a .mjs file located under ./scripts/game
    const gameScripts = [ "coords", "game", "move", "piece", "pre-game", "san" ];

    for (const scriptName of gameScripts){
        module_loader.load(`./${scriptName}.mjs`).then(globalize);
    }

    await module_loader.waitForAll();
    console.log("Modules loaded.");

    gameStateInit();
    puzzleInit();
    createGameFormInit();
    featuredGameInit();
    hashInit();
})();
