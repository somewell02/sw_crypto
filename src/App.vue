<template>
    <div class="container mx-auto flex flex-col items-center bg-gray-100 p-4">
        <loader-screen v-if="loading" />
        <div class="container">
            <section>
                <div class="flex">
                    <div class="max-w-xs">
                        <label for="wallet" class="block text-sm font-medium text-gray-700"
                        >Тикер</label
                        >
                        <div class="mt-1 relative rounded-md shadow-md">
                            <input
                                v-model="ticker"
                                @keydown.enter="addTicker(ticker)"
                                @input="isExistError = null"
                                type="text"
                                name="wallet"
                                id="wallet"
                                class="block w-full pr-10 border-gray-300 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md"
                                placeholder="Например DOGE"
                            />
                        </div>
                        <div
                            v-if="allTickers && ticker"
                            class="flex bg-white shadow-md p-1 rounded-md shadow-md flex-wrap"
                        >
                            <span
                                v-for="t in hintTickers"
                                :key="t.Symbol"
                                @click="addTicker(t.Symbol)"
                                class="inline-flex items-center px-2 m-1 rounded-md text-xs font-medium bg-gray-300 text-gray-800 cursor-pointer">
                              {{ t.Symbol }}
                            </span>
                        </div>
                        <div v-if="isExistError" class="text-sm text-red-600">{{ this.isExistError }}</div>
                    </div>
                </div>
                <button
                    @click="addTicker(ticker)"
                    type="button"
                    class="my-4 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                    <add-icon/>
                    Добавить
                </button>
            </section>

            <template v-if="tickers.length">
                <hr class="w-full border-t border-gray-600 my-4"/>
                <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <div
                        v-for="(t, i) in tickers"
                        :key="i"
                        @click="selectTicker(t)"
                        class="bg-white overflow-hidden shadow rounded-lg border-purple-800 border-solid cursor-pointer"
                        :class="{ 'border-4': sel === t }"
                    >
                        <div class="px-4 py-5 sm:p-6 text-center">
                            <dt class="text-sm font-medium text-gray-500 truncate">
                                {{ t.name }} - USD
                            </dt>
                            <dd class="mt-1 text-3xl font-semibold text-gray-900">
                                {{ t.price }}
                            </dd>
                        </div>
                        <div class="w-full border-t border-gray-200"></div>
                        <button
                            @click.stop="deleteTicker(t)"
                            class="flex items-center justify-center font-medium w-full bg-gray-100 px-4 py-4 sm:px-6 text-md text-gray-500 hover:text-gray-600 hover:bg-gray-200 hover:opacity-20 transition-all focus:outline-none"
                        >
                            <delete-icon/>
                            Удалить
                        </button>
                    </div>
                </dl>
            </template>
            <template v-if="sel">
                <hr class="w-full border-t border-gray-600 my-4"/>
                <section class="relative">
                    <h3 class="text-lg leading-6 font-medium text-gray-900 my-8">
                        {{ sel.name }} - USD
                    </h3>
                    <div class="flex items-end border-gray-600 border-b border-l h-64">
                        <div
                            v-for="(bar, i) in normalizeGraph"
                            :key="i"
                            :style="{ height: `${bar}%`}"
                            class="bg-purple-800 border w-10"
                        ></div>
                    </div>
                    <button
                        type="button"
                        class="absolute top-0 right-0"
                        @click="clearSel"
                    >
                        <close-icon/>
                    </button>
                </section>
            </template>
        </div>
    </div>
</template>

<script>
import CloseIcon from "@/assets/img/icons/CloseIcon";
import DeleteIcon from "@/assets/img/icons/DeleteIcon";
import AddIcon from "@/assets/img/icons/AddIcon";
import LoaderScreen from "@/components/LoaderScreen";

export default {
    name: 'App',
    components: {LoaderScreen, AddIcon, DeleteIcon, CloseIcon},
    data() {
        return {
            ticker: "",
            tickers: [],
            allTickers: null,
            sel: null,
            graph: [],
            isExistError: null,
            loading: true,
        }
    },

    async mounted() {
        const allTickers = await fetch(
            `https://min-api.cryptocompare.com/data/all/coinlist?summary=true&api_key=2bb59c3cba8de19675c26a6a65a1c298b555117ead02f242a572e2b7b0ae2516`
        );
        const data = await allTickers.json();
        this.allTickers = Object.values(data.Data);
        this.loading = false;
    },

    created() {
        const tickersData = localStorage.getItem("crypto-list");
        this.tickers = tickersData ? JSON.parse(tickersData) : [];
        this.tickers.forEach((t) => this.subscribeToUpdates(t.name));
    },

    computed: {
        hintTickers() {
            return this.allTickers.filter((t) => t.FullName.toUpperCase().includes(this.ticker.toUpperCase())).slice(0, 4);
        },
        normalizeGraph() {
            const max = Math.max(...this.graph);
            const min = Math.min(...this.graph);
            return this.graph.map(
                bar => 5 + ((bar - min) * 95) / (max - min)
            );
        },
    },

    methods: {
        isTickerExist(symbol) {
            return this.allTickers.find((t) => t.Symbol === symbol.toUpperCase());
        },
        subscribeToUpdates(tickerName) {
            setInterval(async () => {
                const f = await fetch(
                    `https://min-api.cryptocompare.com/data/price?fsym=${tickerName}&tsyms=USD&api_key=2bb59c3cba8de19675c26a6a65a1c298b555117ead02f242a572e2b7b0ae2516`
                );
                const data = await f.json();
                this.tickers.find(t => t.name === tickerName).price = data.USD > 1 ? data.USD.toFixed(2) : data.USD.toPrecision(2);

                if (this.sel?.name === tickerName) {
                    this.graph.push(data.USD);
                }
            }, 3000);
        },
        addTicker(symbol) {
            if (!this.isTickerExist(symbol)) {
                this.isExistError = "Такого тикера не существует";
            } else if (this.tickers.find((t) => t.name === symbol.toUpperCase())) {
                this.isExistError = "Такой тикер уже добавлен";
            } else {
                const currentTicker = {name: symbol.toUpperCase(), price: "-"};
                this.tickers.push(currentTicker);

                localStorage.setItem("crypto-list", JSON.stringify(this.tickers));

                this.subscribeToUpdates(currentTicker.name);

                this.ticker = "";
                this.isExistError = null;
            }
        },
        deleteTicker(tickerToRemove) {
            this.tickers = this.tickers.filter(t => t !== tickerToRemove);
        },
        selectTicker(tickerToSelect) {
            this.sel = tickerToSelect;
            this.graph = [];
        },
        clearSel() {
            this.sel = null
        },
    }
}
</script>
