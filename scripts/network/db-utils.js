
// useful functions for polling the database and handling with data retrieved.

const DB_URL = "https://script.google.com/macros/s/AKfycbyGAOLIi44JUnRYsrgQbORFql_Q48ykdXbcHdNftH11e5KPZRCpgF7sOVhwUf0u0QoFjw/exec";

async function pollDatabase(method, params){
    const urlParams = new URLSearchParams(params);
    const url = `${DB_URL}?${urlParams}`;

    try {
        const res = await fetch(url, { method });

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


// takes the given table data and converts it into a dictionary.
function tabulateData(data){
    data = tryJSON(data);

    const table = [];

    // assumes header are properties/attributes
    const keys = data.shift();

    // goes through each row and converts it to a dictionary, converting to JSON if necessary
    for (const row of data){
        const item = {};
        for (let k = 0; k < keys.length; k++){
            item[keys[k]] = tryJSON(row[k]);
        }
        table.push(item);
    }

    return table;
}

// either converts the data to JSON or, if it is not valid JSON, returns the data unchanged.
function tryJSON(data){
    try {
        const j = JSON.parse(data);
        return j;
    }
    catch(e){}
    return data;
}

function getGameIdParts(gameId){
    const parts = {
        gameId: undefined,
        userId: undefined,
        rowNum: undefined
    };

    const gameIdParts = gameId.split("_");

    if (!isNaN(gameIdParts[1])){
        // gameId is of the form gameId_rowNum
        parts.gameId = gameIdParts[0];
        parts.rowNum = parseInt(gameIdParts[1]);

        // try to fetch stored user id
        const localFetch = localStorage.getItem(`${parts.gameId}_${parts.rowNum}_userId`);
        if (localFetch)
            parts.userId = localFetch;

    }else{
        // gameId is of the form gameId_userId_rowNum
        parts.gameId = gameIdParts[0];
        parts.userId = gameIdParts[1];
        parts.rowNum = parseInt(gameIdParts[2]);
    }
    
    return parts;
}
