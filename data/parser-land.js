const fs = require('fs');
/**
* Module used to parse the UN's CSV land data into a treemap-able form.
* @module dp
*/

/**
* Helper method to split CSV with string values containing commas - taken from [here]{@link https://stackoverflow.com/questions/8493195/how-can-i-parse-a-csv-string-with-javascript-which-contains-comma-in-data#answer-40672956}.
* @param {string} str - CSV string to parse.
* @returns {array} matches - Array of values previously separated by commas.
*/
function splitCSV (str) {
        var matches = str.match(/(\s*"[^"]+"\s*|\s*[^,]+|,)(?=,|$)/g);
        for (var n = 0; n < matches.length; ++n) {
            matches[n] = matches[n].trim();
            if (matches[n] === ',') matches[n] = '';
        }
        if (str[0] === ',') matches.unshift('');
        return matches;
}

/**
* Helper method to build treemap data of a specific datapoint from land.json file. Creates a file for each year of that specific datapoint.
* @param {string} child - Name of child datapoint to filter for (e.g. 'Forest cover (thousand hectares)').
* @param {string} name - Name to give the output file + data (e.g. 'forest').
*/
function buildTreemapData (child, name) {
    fs.readFile('./land.json', 'utf-8', (err, data) => {
        if (err) throw err;
        const json = JSON.parse(data);
        for (const key in json) {
            const base = {
                name: 'Land_' + name + '_' + key,
                children: []
            };

            const yeardata = json[key];
            for (var country in yeardata) {
                var obj = {
                    name: country,
                    children: []
                };

                var flag = false;

                for (var i = yeardata[country].length - 1; i >= 0; i--) {
                    if (yeardata[country][i].name === 'Land area (thousand hectares)') {
                        flag = true;
                    }

                    if (yeardata[country][i].name !== child) {
                        continue;
                    }

                    yeardata[country][i].name = country + ' - ' + yeardata[country][i].name;

                    obj.children.push(yeardata[country][i]);
                }

                if (flag) {
                    base.children.push(obj);
                }
            }

            fs.writeFile('land_' + name + '_' + key + '.json', JSON.stringify(base), (err) => {
                if (err) throw err;
                console.log(key + ' data saved!');
            });
        }
    });
}

/**
* Helper method to prune CSV data as well as categorise it in a JSON format object with the year of the data as the key.
* @param {string} data - CSV text to parse.
* @returns {object} countries - JSON object with years as keys of more json objects which have countries as keys of arrays containing the CSV datapoints.
*/
function dictYears (data) {
    const lines = data.split('\n');
    const countries = {};
    console.log(lines.length);

    for (var i = 1; i < lines.length; i++) {
        const split = splitCSV(lines[i]);

        const year = split[2];
        const country = split[1];

        if (!Object.prototype.hasOwnProperty.call(countries, year)) {
            countries[year] = {};
        }

        const ds = countries[year];

        if (!Object.prototype.hasOwnProperty.call(ds, country)) {
            countries[year][country] = [];
        }

        const datapoint = {
            name: split[3],
            value: Number(split[4])
        };

        countries[year][country].push(datapoint);
    }

    return countries;
}

fs.readFile('./land.csv', 'utf-8', (err, data) => {
    if (err) throw err;
    const countries = dictYears(data);

    fs.writeFile('land.json', JSON.stringify(countries), (err) => {
        if (err) throw err;
        console.log('First parse complete!');
        buildTreemapData('Forest cover (thousand hectares)', 'forest');
        buildTreemapData('Land area (thousand hectares)', 'all_area');
    });
});
