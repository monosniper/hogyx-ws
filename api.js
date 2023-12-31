const {API_URL} = require("./config");

const api = (url, body = {}, method = 'post') => {
    body = body ? JSON.stringify(body) : undefined

    return fetch(`${API_URL}${url}`, {
        method, body,
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
        }
    }).then(rs => rs.json()).catch(err => console.log(err))
}

module.exports = api