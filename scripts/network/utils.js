const DB_URL = "https://script.google.com/macros/s/AKfycbyGAOLIi44JUnRYsrgQbORFql_Q48ykdXbcHdNftH11e5KPZRCpgF7sOVhwUf0u0QoFjw/exec";

const NETWORK = {
    gameId: undefined,
    userId: undefined,
    refNum: undefined,
    moveNum: undefined
};


async function pollDatabase(method, params){
    const urlParams = new URLSearchParams(params);
    const url = `${DB_URL}?${urlParams}`;

    try {
        const res = await fetch(url);

        if (!res.ok)
            throw new Error(`ERROR: ${method} ${params} ${url}`);

        return await res.text();
    }
    catch(err){
        throw new Error(err);
    }
}

function storeUserId(gameId, refNum, userId){
    localStorage.setItem(`${gameId}_${refNum}_userId`, userId);
}

function fetchUserId(gameId, refNum){
    return localStorage.getItem(`${gameId}_${refNum}_userId`);
}

function getMyId(){
    let id = "";
    if (NETWORK.gameId){
        id = `${NETWORK.gameId}`;
        if (NETWORK.userId){
            id += `_${NETWORK.userId}`;
        }
        if (NETWORK.refNum){
            id += `_${NETWORK.refNum}`;
        }
    }
    return id;
}

function setMyId(id){
    console.log(`Set ID ${id}`);
    const parts = id.split("_");
    const lastPart = parts[parts.length - 1];

    if (!isNaN(lastPart)){
        if (parts.length == 3){
            NETWORK.gameId = parts[0];
            NETWORK.userId = parts[1];
            NETWORK.refNum = parseInt(parts[2]);
        }else if (parts.length == 2){
            NETWORK.gameId = parts[0];
            NETWORK.refNum = parseInt(parts[1]);
        }
    }else{
        // game id, user id, and ref num
        if (parts.length == 2){
            NETWORK.gameId = parts[0];
            NETWORK.userId = parts[1];
        }else{
            NETWORK.gameId = parts[0];
        }
    }
}

// copies the text to the user's clipboard
function copyToClipboard(elem, txt){
    // try method that most likely works...
    try {
        navigator.clipboard.writeText(txt);
        return true;
    }
    catch(err){
        console.error(err);
    }

    // try a different method
    try {
        elem.select();
        document.execCommand("copy");
        return true;
    }
    catch(err){
        console.error(err);
    }

    // no method worked.
    return false;
}
