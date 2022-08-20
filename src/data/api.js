const API_KEY = "2bb59c3cba8de19675c26a6a65a1c298b555117ead02f242a572e2b7b0ae2516";
const AGGREGATE_INDEX = "5";
const ERROR_INDEX = "500";
const INVALID_SUB_MESSAGE = "INVALID_SUB";

const tickersHandlers = new Map();
const socket = new WebSocket(`wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`);

// const worker = new SharedWorker("shared-worker.js");
// console.log(worker);
// worker.port.onmessage = (e) => {
//     console.log(e.data);
// }
// worker.port.postMessage("testing");

let btcToUsdPrice = 0;

socket.addEventListener("message", (e) => {
    const {
        TYPE: type,
        MESSAGE: message,
        PARAMETER: parameter,
        FROMSYMBOL: currency,
        TOSYMBOL: tsym,
        PRICE: newPrice
    } = JSON.parse(e.data);

    if (type === ERROR_INDEX && message === INVALID_SUB_MESSAGE && parameter.split("~")[3] === "USD") {
        if (!tickersHandlers.get("BTC")) {
            subscribeToTickerOnWs("BTC", "USD");
        }
        subscribeToTickerOnWs(parameter.split("~")[2], "BTC");
        return;
    } else if (type !== AGGREGATE_INDEX || !newPrice) {
        return;
    }

    if (currency === "BTC") {
        btcToUsdPrice = newPrice;
    }

    const handlers = tickersHandlers.get(currency) ?? [];
    if (tsym === "USD") {
        handlers.forEach(fn => fn(newPrice));
    } else {
        handlers.forEach(fn => fn(newPrice*btcToUsdPrice));
    }
});

const sendToWS = (message) => {
    const stringifiedMessage = JSON.stringify(message);

    if (socket.readyState === WebSocket.OPEN) {
        socket.send(stringifiedMessage);
    } else {
        socket.addEventListener("open", () => {
            socket.send(stringifiedMessage);
        }, {once: true});
    }
}

const subscribeToTickerOnWs = (tickerName, tsym) => {
    sendToWS({
        "action": "SubAdd",
        "subs": [`5~CCCAGG~${tickerName}~${tsym}`],
    });
}

const unsubscribeFromTickerOnWs = (tickerName, tsym) => {
    sendToWS({
        "action": "SubRemove",
        "subs": [`5~CCCAGG~${tickerName}~${tsym}`],
    });
}

export const subscribeToTicker = (ticker, cb) => {
    const subscribers = tickersHandlers.get(ticker) || [];
    tickersHandlers.set(ticker, [...subscribers, cb]);
}

export const unsubscribeFromTicker = (ticker, cb) => {
    if (tickersHandlers.has(ticker)) {
        const subscribers = tickersHandlers.get(ticker) || [];
        tickersHandlers.set(ticker, subscribers.filter(fn => fn !== cb));
    }
}

export const addTicker = (ticker, cb) => {
    subscribeToTicker(ticker, cb);
    subscribeToTickerOnWs(ticker, "USD");
}

export const deleteTicker = (ticker) => {
    tickersHandlers.delete(ticker);
    unsubscribeFromTickerOnWs(ticker, "USD");
}

export const loadAllTickers = () => {
    const url = new URL("https://min-api.cryptocompare.com/data/all/coinlist");
    url.searchParams.set("summary", "true");
    url.searchParams.set("api_key", API_KEY);

    return fetch(url.toString())
        .then(data => data.json());
}

export const loadTickerHistory = (tickerName, limit) => {
    const url = new URL("https://min-api.cryptocompare.com/data/v2/histominute");
    url.searchParams.set("fsym", tickerName);
    url.searchParams.set("tsym", "USD");
    url.searchParams.set("limit", limit);
    url.searchParams.set("api_key", API_KEY);

    return fetch(url.toString())
        .then(data => data.json());
}
