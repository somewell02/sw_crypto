import {loadAllTickers} from "@/data/api";

export default {
    namespaced: true,
    state: () => ({
        allTickers: [],
    }),
    getters: {
        getAllTickers(state) {
            return state.allTickers;
        },
    },
    mutations: {
        updateAllTickers(state, tickers) {
            state.allTickers = tickers;
        }
    },
    actions: {
        async fetchAllTickers({commit}) {
            const allTickersRes = await loadAllTickers();
            const allTickersData = Object.values(allTickersRes.Data);
            commit('updateAllTickers', allTickersData);
        }
    },
}