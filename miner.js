const {servers_cap} = require("./config");
const api = require("./api");
const {generateWallet, getRandomEl, callRandomFunction, getRandomFloat, randomIntFromInterval, chanceCall} = require("./utils");

class Log {
    static TYPE_MINER = 'miner'
    static TYPE_SERVERS = 'servers'
}

class Found {
    static TYPE_COIN = 'coin'
    static TYPE_NFT = 'nft'
}

class Miner {
    constructor(session_data, update_callback, ready_callback) {
        this.session = session_data
        this.update = update_callback
        this.ready_callback = ready_callback
        this.interval = 1000
        this.current_server = null;
        this.servers_updated = {};
        this.timestamp = new Date(this.session.created_at);
        this.nfts = []

        if (!this.session.logs) this.session.logs = []

        if (this.session.servers.find(userServer => userServer.server.nft)) {
            api("nfts", false, 'get').then(rs => {
                this.nfts = rs.data
            }).then(() => this.start())
        } else this.start()
    }

    getRandomCoin() {
        return getRandomEl(this.session.coins)
    }

    setCurrentServer(server) {
        this.current_server = server;
    }

    getCoinAmount(values, coin) {
        const usd_amount = getRandomFloat(values[0], values[1], 2)
        const rate = this.session.coins.find(({ slug }) => slug === coin).rate

        return parseFloat((usd_amount / rate).toFixed(10))
    }

    addSeconds(seconds=1) {
        const newTimestamp = this.timestamp
        newTimestamp.setSeconds(this.timestamp.getSeconds() + seconds)
        this.timestamp = newTimestamp
    }

    serversUpdated() {
        return Object.values(this.servers_updated).filter(val => val).length === Object.values(this.servers_updated).length
    }

    start() {
        this.addLog({
            type: Log.TYPE_MINER,
            text: "Session started",
            contrast: "ID: " + this.session.id,
        })

        this.addSeconds(randomIntFromInterval(1, 5))

        this.session.coins.forEach(coin => {
            if(coin.hardLoad) {
                this.addLog({
                    type: Log.TYPE_MINER,
                    text: "Hard Load",
                    contrast: "Coin: " + coin.slug,
                })
                this.addSeconds(randomIntFromInterval(1, 3))
            }
        })

        this.session.servers.forEach((userServer) => {
            this.servers_updated[userServer.id] = false;
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

                const current_coin = this.getRandomCoin();

                chanceCall(() => {
                    this.addServerLog({
                        coin: current_coin.slug,
                        text: "Wallet Check:",
                        contrast: generateWallet(),
                    })

                    const cap = servers_cap[this.current_server.server.type].chances
                    const cap_coin = cap.coin
                    const coin = current_coin.slug;

                    const list = [
                        {
                            chance: cap_coin.chance / 100,
                            func: () => ({
                                type: Found.TYPE_COIN,
                                amount: this.getCoinAmount(cap_coin.values, coin),
                                id: coin,
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
                }, current_coin.hardLoad ? 40 : 100)
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

            const this_server_id = this.current_server.id

            console.log("logs count: " + this.current_server.logs.length)
            console.log("founds count: " + this.current_server.founds.length)
            if(this.current_server.logs.length <= 3600) {
                this.update({
                    logs: this.current_server.logs,
                    founds: this.current_server.founds,
                }, 'user/servers/'+this.current_server.id).then((rs) => {
                    if(rs) this.servers_updated[this_server_id] = rs.success
                })
            } else {
                const chunkSize = 1800;
                const data = {
                    logs: [],
                    founds: [],
                }
                for (let i = 0; i < this.current_server.logs.length; i += chunkSize) {
                    data.logs = this.current_server.logs.slice(i, i + chunkSize);
                    data.founds = this.current_server.founds.slice(i, i + chunkSize);

                    console.log(data)

                    this.update(data, 'user/servers/'+this.current_server.id)
                }

                this.servers_updated[this_server_id] = true
            }
        })

        const _this = this

        function tryUpdate() {
            if(_this.serversUpdated()) {
                _this.update(_this.session).then(_this.ready_callback)
            } else {
                setTimeout(tryUpdate, 1000)
            }
        }

        tryUpdate()
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