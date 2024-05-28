const DB_URL = "https://script.google.com/macros/s/AKfycbySLxk64kjk7h8a5hXLvhSsErk_cly6274xgky69rWu67fvbLzK2mrZye78tIxQYWPTCA/exec";

const NETWORK = {
    gameId: undefined,
    userId: undefined,
    refNum: undefined,
    moveNum: undefined
};


function pollDatabase(method, params){
    const xhr = new XMLHttpRequest();

    const urlParams = new URLSearchParams(params);
    const url = `${DB_URL}?${urlParams}`;

    const promise = new Promise((res, rej) => {
        xhr.onreadystatechange = () => {
            if (xhr.readyState == 4){
                res(xhr.responseText);
            }
        }
    });

    xhr.open(method, url);
    xhr.send();

    return promise;
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
