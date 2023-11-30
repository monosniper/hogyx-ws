const {servers_cap} = require("./config");
const api = require("./api");
const {generateWallet, getRandomEl, callRandomFunction, getRandomFloat, randomIntFromInterval} = require("./utils");

class Log {
    static TYPE_MINER = 'miner'
    static TYPE_SERVERS = 'servers'
}

class Found {
    static TYPE_COIN = 'coin'
    static TYPE_NFT = 'nft'
}

class Miner {
    constructor(session_data, update_callback) {
        this.session = session_data
        this.update = update_callback
        this.interval = 1000
        this.current_server = null;
        this.timestamp = new Date(this.session.created_at);
        this.nfts = []
        console.log(this.session.created_at)
        if (!this.session.logs) this.session.logs = []

        if (this.session.servers.find(userServer => userServer.server.nft)) {
            api("nfts", false, 'get').then(rs => {
                this.nfts = rs.data
            }).then(() => this.start())
        } else this.start()
    }

    getRandomCoinId() {
        return getRandomEl(this.session.coins).id
    }

    setCurrentServer(server) {
        this.current_server = server;
    }

    getCoinAmount(values, coin_id) {
        const usd_amount = getRandomFloat(values[0], values[1], 2)
        const rate = this.session.coins.find(({ id }) => id === coin_id).rate

        return parseFloat((usd_amount / rate).toFixed(2))
    }

    addSeconds(seconds=1) {
        const newTimestamp = this.timestamp
        newTimestamp.setSeconds(this.timestamp.getSeconds() + seconds)
        this.timestamp = newTimestamp
    }

    start() {
        this.addLog({
            type: Log.TYPE_MINER,
            text: "Session started",
            contrast: "ID: " + this.session.id,
        })

        this.addSeconds(randomIntFromInterval(1, 5))

        this.session.servers.forEach((userServer) => {
            this.setCurrentServer(userServer)
            const work_time = servers_cap[userServer.server.type].work_time * (1000 / this.interval)

            userServer.logs = []
            userServer.founds = []

            this.addLog({
                type: Log.TYPE_SERVERS,
                text: "Starting server:",
                contrast: userServer.name,
            })

            this.addSeconds(randomIntFromInterval(3, 10))

            this.addLog({
                type: Log.TYPE_SERVERS,
                text: "Current server:",
                contrast: userServer.name,
            })

            this.addSeconds(randomIntFromInterval(1, 3))

            for(let i = 1; i <= work_time; i++) {
                // i % 2 === 0 && this.addSeconds()
                this.addSeconds()

                this.addServerLog({
                    coin_id: this.getRandomCoinId(),
                    text: "Wallet Check:",
                    contrast: generateWallet(),
                })

                const cap = servers_cap[this.current_server.server.type].chances
                const cap_coin = cap.coin
                const coin_id = this.getRandomCoinId();

                const list = [
                    {
                        chance: cap_coin.chance / 100,
                        func: () => ({
                            type: Found.TYPE_COIN,
                            amount: this.getCoinAmount(cap_coin.values, coin_id),
                            id: coin_id,
                        })
                    }
                ]

                if (this.current_server.server.nft) {
                    list.push({
                        chance: cap.nft / 100,
                        func: () => ({
                            type: Found.TYPE_NFT,
                            id: getRandomEl(this.nfts).id,
                        })
                    })
                }

                const found = callRandomFunction(list)

                if (found) {
                    const found_data = found.func()
                    found_data && this.addServerFound(found_data)
                }
            }

            let sum = 0
            let nfts = 0
            this.current_server.founds.forEach(found => {
                if(found.type === 'nft') nfts += 1
                else sum += found.amount
            })

            console.log(sum)
            console.log("nfts count: " + nfts)
            console.log("checks: " + this.current_server.logs.length)
            console.log("founds: " + this.current_server.founds.length)

            this.update(this.current_server, 'user/servers/'+this.current_server.id)
        })

        this.update(this.session)
    }

    addServerLog(data) {
        const timestamp = new Date(this.timestamp.toString())
        this.current_server.logs.push({...data, timestamp})
    }

    addServerFound(data) {
        const timestamp = new Date(this.timestamp.toString())
        this.current_server.founds.push({...data, timestamp})
    }

    addLog(data) {
        const timestamp = new Date(this.timestamp.toString())
        this.session.logs.push({...data, timestamp})
    }
}

module.exports = Miner