module.exports = {
    // API_URL: "http://localhost:8000/v1/",
    API_URL: "https://api.hogyx.io/v1/",
    check_interval: 500,

    statuses: {
        work: 'work',
        active: 'active',
        not_active: 'not active',
    },

    servers_cap: {
        free: {
            work_time: 600, // 10 mins $(0.3 - 3)
            chances: {
                coin: {
                    chance: 10,
                    values: [0.01, 0.1]
                }
            }
        },
        standard: {
            work_time: 1800, // 30 mins $(0.9 - 9)
            chances: {
                coin: {
                    chance: 10,
                    values: [0.01, 0.1]
                },
            }
        },
        pro: {
            work_time: 3600, // 1 hour $(1.8 - 18)
            chances: {
                coin: {
                    chance: 10,
                    values: [0.01, 0.1]
                },
                nft: 5 / 3600 // 5% in an hour
            }
        },
        premium: {
            work_time: 10800, // 3 hours $(5.4 - 54)
            chances: {
                coin: {
                    chance: 10,
                    values: [0.01, 0.1]
                },
                nft: 15 / 3600 // 15% in an hour
            }
        },
        elite: {
            work_time: 25200, // 7 hours $(12.6 - 126)
            chances: {
                coin: {
                    chance: 10,
                    values: [0.01, 0.1]
                },
                nft: 25 / 3600 // 25% in an hour
            }
        },
        max: {
            work_time: 86400, // 24 hours $(43.2 - 432)
            chances: {
                coin: {
                    chance: 10,
                    values: [0.01, 0.1]
                },
                nft: 40 / 3600 // 40% in an hour
            }
        }
    }
}