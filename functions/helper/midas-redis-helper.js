const client = require('redis').createClient({
    url: "redis://midascache.c7fgoy.ng.0001.apse1.cache.amazonaws.com:6379",
    // retry_strategy: function(options) {
    //     if (options.error && options.error.code === "ECONNREFUSED") {
    //     // End reconnecting on a specific error
    //     return new Error("The server refused the connection");
    //     }
    //     if (options.total_retry_time > 1000 * 60 * 60) {
    //     // End reconnecting after a specific timeout
    //     return new Error("Retry time exhausted");
    //     }
    //     if (options.attempt > 10) {
    //     // End reconnecting with built in error
    //     return undefined;
    //     }

    //     // reconnect after
    //     return Math.min(options.attempt * 100, 3000);
    // },    
});

// client.on('connect'     , () => console.log('connect'));
// client.on('ready'       , () => console.log('ready'));
// client.on('reconnecting', () => console.log('reconnecting'));
// client.on('error'       , () => console.log('error'));
// client.on('end'         , () => console.log('end'));
// client.on('ready', () => {
//     let response = client.ping()
//     console.log(response)
//     // do other stuff
// });
let connectClient = client.connect();
connectClient.then(res => console.log('connected'));

// console.log('client kedua: ', client);

module.exports = {
    client
}