const request = require("request");

function callApi(url){
    return new Promise((resolve, reject) => {
        request.get(url, (error, response, body) => {
            resolve(JSON.parse(body))
        })
    })
}

module.exports = callApi