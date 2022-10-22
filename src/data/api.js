import { channelPostMessage, sendTickersData } from "@/data/broadcast-channel";

const API_KEY = "2bb59c3cba8de19675c26a6a65a1c298b555117ead02f242a572e2b7b0ae2516";
export const MAIN_CURRENCY = "USD";
export const AGGREGATE_INDEX = "5";
const ERROR_INDEX = "500";
const INVALID_SUB_MESSAGE = "INVALID_SUB";

const API_URL = "https://min-api.cryptocompare.com";
export const API_SITE_URL = "https://www.cryptocompare.com";

export const tickersHandlers = new Map();
const socket = new WebSocket(`wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`);

let btcToUsdPrice = 0;

export const handleTickers = (e) => {
    const {
        TYPE: type,
        MESSAGE: message,
        PARAMETER: parameter,
        FROMSYMBOL: currency,
        TOSYMBOL: tsym,
        PRICE: newPrice
    } = JSON.parse(e.data);

    if (type === ERROR_INDEX && message === INVALID_SUB_MESSAGE && parameter.split("~")[3] === MAIN_CURRENCY) {
        if (!tickersHandlers.get("BTC")) {
            subscribeToTickerOnWs("BTC", MAIN_CURRENCY);
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
    if (tsym === MAIN_CURRENCY) {
        handlers.forEach(fn => fn(newPrice));
    } else {
        handlers.forEach(fn => fn(newPrice*btcToUsdPrice));
    }
};

socket.addEventListener("message", handleTickers);
socket.addEventListener("message", sendTickersData);

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

export const subscribeToTickerOnWs = (tickerName, tsym) => {
    sendToWS({
        "action": "SubAdd",
        "subs": [`5~CCCAGG~${tickerName}~${tsym}`],
    });
}

export const unsubscribeFromTickerOnWs = (tickerName, tsym) => {
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
    subscribeToTickerOnWs(ticker, MAIN_CURRENCY);
    channelPostMessage("add-ticker", { ticker })
}

export const deleteTicker = (ticker) => {
    tickersHandlers.delete(ticker);
    unsubscribeFromTickerOnWs(ticker, MAIN_CURRENCY);
    channelPostMessage("delete-ticker", { ticker })
}

export const loadAllTickers = async () => {
    const url = new URL(`${API_URL}/data/all/coinlist`);
    url.searchParams.set("summary", "true");
    url.searchParams.set("api_key", API_KEY);

    return fetch(url.toString())
        .then(data => data.json());
}

export const getTickerData = async symbol => {
    const url = new URL(`${API_URL}/data/all/coinlist`);
    url.searchParams.set("summary", "false");
    url.searchParams.set("fsym", symbol);
    url.searchParams.set("api_key", API_KEY);

    return fetch(url.toString())
        .then(data => data.json())
        .then(res => res.Data[symbol]);
}

export const loadTickerHistory = async (tickerName, limit) => {
    const url = new URL(`${API_URL}/data/v2/histominute`);
    url.searchParams.set("fsym", tickerName);
    url.searchParams.set("tsym", MAIN_CURRENCY);
    url.searchParams.set("limit", limit);
    url.searchParams.set("api_key", API_KEY);

    return fetch(url.toString())
        .then(data => data.json());
}