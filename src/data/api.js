const API_KEY = "2bb59c3cba8de19675c26a6a65a1c298b555117ead02f242a572e2b7b0ae2516";

const tickersHandlers = new Map();

const socket = new WebSocket(`wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`);
const AGGREGATE_INDEX = "5";
const ERROR_INDEX = "500";
const INVALID_SUB_MESSAGE = "INVALID_SUB";

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
    subscribeToTickerOnWs(ticker, "USD");
}

export const unsubscribeFromTicker = (ticker) => {
    tickersHandlers.delete(ticker);
    unsubscribeFromTickerOnWs(ticker, "USD");
}


export const loadAllTickers = () => {
    return fetch(
        `https://min-api.cryptocompare.com/data/all/coinlist?summary=true&api_key=${API_KEY}`
    ).then(data => data.json());
}

export const loadTickerHistory = (tickerName, limit) => {
    return fetch(
        `https://min-api.cryptocompare.com/data/v2/histominute?fsym=${tickerName}&tsym=USD&limit=${limit}&api_key=${API_KEY}`
    ).then(data => data.json());
}