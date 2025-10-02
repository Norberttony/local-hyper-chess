
export function getFirstElemOfClass(container, className){
    return container.getElementsByClassName(className)[0];
}

// copies the text to the user's clipboard
export function copyToClipboard(elem, txt){
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

export async function sleep(amt){
    return new Promise(async (res, rej) => {
        setTimeout(() => {
            res();
        }, amt);
    });
}
