
const module_loader = new Module_Loader();

{
    // makes the assumption that this is a .mjs file located under ./scripts/game
    const gameScripts = [ "coords", "game", "move", "piece", "pre-game", "san" ];

    for (const scriptName of gameScripts){
        module_loader.load(`./${scriptName}.mjs`).then(globalize);
    }

    module_loader.waitForAll().then(() => console.log("Modules loaded."));
}
