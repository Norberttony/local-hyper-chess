
const module_loader = new Module_Loader();

{
    // makes the assumption that this is a .mjs file located under ./scripts/game
    const gameScripts = [ "coords", "game", "move", "piece", "pre-game", "san" ];
    const graphicsScripts = [ "board-graphics", "input", "pool" ];
    const widgetScripts = [
        "animations", "annotator-widget", "audio-widget", "board-widget", "engine-widget",
        "extras-widget", "pgn-widget", "players-widget"
    ];
    const localWidgets = [
        "network-widget", "puzzles-widget", "web-phil-widget"
    ];

    for (const scriptName of gameScripts)
        module_loader.load(`../../node_modules/hyper-chess-board/game/${scriptName}.mjs`).then(globalize);
    for (const scriptName of graphicsScripts)
        module_loader.load(`../../node_modules/hyper-chess-board/graphics/${scriptName}.mjs`).then(globalize);
    for (const scriptName of widgetScripts)
        module_loader.load(`../../node_modules/hyper-chess-board/graphics/widgets/${scriptName}.mjs`).then(globalize);
    for (const scriptName of localWidgets)
        module_loader.load(`../graphics/widgets/${scriptName}.mjs`).then(globalize);

    module_loader.waitForAll().then(() => console.log("Modules loaded."));
}
