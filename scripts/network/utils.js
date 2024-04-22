const DB_URL = "";

const NETWORK = {
    gameId: undefined,
    userId: undefined,
    refNum: undefined,
    moveNum: undefined
};
if (localStorage.getItem("userId"))
    NETWORK.userId = localStorage.getItem("userId");


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
    if (NETWORK.gameId && NETWORK.refNum){
        id = `${NETWORK.gameId}`;
        if (NETWORK.userId){
            id = `${id}_${NETWORK.userId}`;
        }
        id = `${id}_${NETWORK.refNum}`;
    }
    return id;
}

function setMyId(id){
    const parts = id.split("_");
    if (parts.length == 2){
        // game id and ref num
        NETWORK.gameId = parts[0];
        NETWORK.refNum = parseInt(parts[1]);
    }else if (parts.length == 3){
        // game id, user id, and ref num
        NETWORK.gameId = parts[0];
        NETWORK.userId = parts[1];
        NETWORK.refNum = parseInt(parts[2]);

        localStorage.setItem("userId", parts[1]);
    }
}
