
// useful functions for polling the database and handling with data retrieved.


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
