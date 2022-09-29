import { createStore } from "vuex";
import allTickersModule from "./all-tickers";

export default createStore({
    state: () => ({
        darkTheme: false,
    }),
    modules: {
        allTickers: allTickersModule
    },
});