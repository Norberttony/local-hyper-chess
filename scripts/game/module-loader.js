
// Loads modules with an option to wait for all of them to finish.

class Module_Loader {
    constructor(){
        this.promises = [];
    }

    // returns a promise
    load(url){
        const promise = import(url)
            .catch((err) => {
                console.log(`Failed to import module at ${url} because ${err}`);
            });
        this.promises.push(promise);
        return promise;
    }

    // returns a promise
    waitForAll(){
        return Promise.allSettled(this.promises);
    }
}


// perform mass pollution of the global namespace until the smog cuts the sun and causes
// developer emigration.
function globalize(module){
    for (const key in module){
        this[key] = module[key];
    }
}
