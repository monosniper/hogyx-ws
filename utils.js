function randomIntFromInterval(min, max) { // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min)
}

function getRandomFloat(min, max, decimals) {
    const str = (Math.random() * (max - min) + min).toFixed(decimals);

    return parseFloat(str);
}

function generateWallet() {
    const length = 37;
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return "0х72С" + result;
}

function getRandomEl(items) {
    return items[Math.floor(Math.random()*items.length)]
}

function callRandomFunction(list) {
    const rand = Math.random() // get a random number between 0 and 1
    let accumulatedChance = 0 // used to figure out the current

    return list.find(function (element) { // iterate through all elements
        accumulatedChance += element.chance // accumulate the chances
        return accumulatedChance >= rand // tests if the element is in the range and if yes this item is stored in 'found'
    })
}

module.exports = {
    randomIntFromInterval,
    generateWallet,
    getRandomEl,
    callRandomFunction,
    getRandomFloat,
}