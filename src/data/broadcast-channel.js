import {
    AGGREGATE_INDEX,
    MAIN_CURRENCY,
    tickersHandlers,
    handleTickers,
    subscribeToTickerOnWs,
    unsubscribeFromTickerOnWs
} from "@/data/api";

export const channel = new BroadcastChannel('app-data');

export const sendTickersData = (e) => {
    const {
        TYPE: type,
        PRICE: newPrice
    } = JSON.parse(e.data);

    if (type === AGGREGATE_INDEX && newPrice) {
        channel.postMessage({ type: "update-prices", data: e.data });
    }
}

export const channelPostMessage = (type, data) => {
    channel.postMessage({ type: type, data: data});
}

channel.addEventListener("message", (event) => {
    const { type, data } = event.data;
    switch (type) {
        case "update-prices":
            handleTickers(event.data);
            break;
        case "add-ticker":
            if (!tickersHandlers.has(data.ticker)) {
                subscribeToTickerOnWs(data.ticker, MAIN_CURRENCY);
            }
            break;
        case "delete-ticker":
            if (tickersHandlers.has(data.ticker)) {
                tickersHandlers.delete(data.ticker);
                unsubscribeFromTickerOnWs(data.ticker, MAIN_CURRENCY);
            }
            break;
    }
});