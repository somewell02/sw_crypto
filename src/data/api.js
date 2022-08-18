const API_KEY = "2bb59c3cba8de19675c26a6a65a1c298b555117ead02f242a572e2b7b0ae2516";
const tickersHandlers = new Map();

const loadTickers = () => {
    if (!tickersHandlers.size) return;

    return fetch(
        `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${[...tickersHandlers.keys()].join(',')}&tsyms=USD&api_key=${API_KEY}`
    )
        .then(data => data.json())
        .then(rawData => {
            const updatedData = Object.fromEntries(
                Object.entries(rawData).map(([key, value]) => [key, value.USD])
            );

            Object.entries(updatedData).forEach(([currency, newPrice]) => {
                const handlers = tickersHandlers.get(currency) ?? [];
                handlers.forEach(fn => fn(newPrice));
            })
        });
}

export const subscribeToTicker = (ticker, cb) => {
    const subscribers = tickersHandlers.get(ticker) || [];
    tickersHandlers.set(ticker, [...subscribers, cb]);
}

export const unsubscribeFromTicker = (ticker) => {
    // const subscribers = tickersHandlers.get(ticker) || [];
    // tickersHandlers.set(ticker, subscribers.filter(fn => fn !== cb));
    tickersHandlers.delete(ticker);
}

setInterval(loadTickers, 3000);


export const loadAllTickers = () => {
    return fetch(
        `https://min-api.cryptocompare.com/data/all/coinlist?summary=true&api_key=${API_KEY}`
    ).then(data => data.json());
}