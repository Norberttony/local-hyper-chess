const DB_URL = "https://script.google.com/macros/s/AKfycbyyggVkETFlysIK_pQhw_1Cjuwi8tkKZnf4L77oqv37D8gz8Vp3HWhzYTGF8SkTROzE0g/exec";

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
