<template>
    <div class="container mx-auto flex flex-col items-center bg-gray-100 p-4">
        <loader-screen v-if="loading"/>
        <div class="container">
            <section>
                <div class="flex">
                    <div class="max-w-xs">
                        <label for="wallet" class="block text-sm font-medium text-gray-700"> Тикер </label>
                        <div class="mt-1 relative rounded-md shadow-md">
                            <bordered-input
                                v-model="ticker"
                                @keydown.enter="addTicker(ticker)"
                                @input="isExistError = null"
                                name="wallet"
                                id="wallet"
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
                <filled-button @click="addTicker(ticker)" class="my-4">
                    <add-icon/>
                    Добавить
                </filled-button>
            </section>

            <template v-if="tickers.length">
                <hr class="w-full border-t border-gray-600 my-4"/>
                <div class="flex justify-between items-center">
                    <div class="flex items-center">
                        <bordered-input
                            v-model="search"
                            type="text"
                            name="search"
                            id="search"
                            placeholder="Поиск..."
                        />
                    </div>
                    <div>
                        <filled-button v-if="page > 1" @click="page--">Назад</filled-button>
                        <filled-button v-if="hasNextPage" @click="page++" class="ml-4">Вперед
                        </filled-button>
                    </div>
                </div>
                <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <div
                        v-for="(t, i) in paginatedTickers"
                        :key="i"
                        @click="selectTicker(t)"
                        class="overflow-hidden shadow rounded-lg border-purple-800 border-solid cursor-pointer"
                        :class="{
                            'border-4': selectedTicker === t,
                            'bg-white': t.price !== '-',
                            'bg-red-100': t.price === '-',
                        }"
                    >
                        <div class="px-4 py-5 sm:p-6 text-center">
                            <dt class="text-sm font-medium text-gray-500 truncate">
                                {{ t.name }} - USD
                            </dt>
                            <dd class="mt-1 text-3xl font-semibold text-gray-900">
                                {{ formatPrice(t.price) }}
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
            <template v-if="selectedTicker">
                <hr class="w-full border-t border-gray-600 my-4"/>
                <section class="relative">
                    <h3 class="text-lg leading-6 font-medium text-gray-900 my-8">
                        {{ selectedTicker.name }} - USD
                    </h3>
                    <div class="flex items-end border-gray-600 border-b border-l h-64" ref="graph">
                        <div
                            v-for="(bar, i) in normalizedGraph"
                            :key="i"
                            :style="{
                                height: `${bar}%`,
                                width: `${$options.GRAPH_ELEMENT_WIDTH}px`
                            }"
                            class="bg-purple-800 border"
                        ></div>
                    </div>
                    <button
                        type="button"
                        class="absolute top-0 right-0"
                        @click="clearSelectedTicker"
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
import BorderedInput from "@/components/BorderedInput";
import FilledButton from "@/components/FilledButton";

import {
    loadAllTickers,
    loadTickerHistory,
    subscribeToTicker,
    unsubscribeFromTicker,
    addTicker,
    deleteTicker,
} from "@/data/api";

export default {
    GRAPH_ELEMENT_WIDTH: 38,
    COUNT_ON_PAGE: 6,
    TICKERS_LS_KEY: "crypto-list",

    name: 'App',
    components: {FilledButton, BorderedInput, LoaderScreen, AddIcon, DeleteIcon, CloseIcon},

    data() {
        return {
            ticker: "",
            tickers: [],
            graph: [],
            allTickers: null,
            selectedTicker: null,

            isExistError: null,
            loading: true,

            search: "",
            page: 1,
            maxGraphElements: 1,
        }
    },

    async mounted() {
        const allTickersData = await loadAllTickers();
        this.allTickers = Object.values(allTickersData.Data);
        this.loading = false;

        window.addEventListener("resize", this.calculateMaxGraphElements);
        window.addEventListener("resize", this.fixGraphLength);
    },

    beforeUnmount() {
        window.removeEventListener("resize", this.calculateMaxGraphElements);
        window.removeEventListener("resize", this.fixGraphLength);
    },

    created() {
        const windowData = Object.fromEntries(new URL(window.location).searchParams.entries());
        const VALID_KEYS = ["search", "page"];
        VALID_KEYS.forEach((key) => {
            if (windowData[key]) {
                this[key] = windowData[key];
            }
        });

        const tickersData = localStorage.getItem(this.$options.TICKERS_LS_KEY);
        if (tickersData) {
            this.tickers = JSON.parse(tickersData);
            this.tickers.forEach(t => {
                addTicker(t.name, (newPrice) => this.updateTickerPrice(t.name, newPrice));
            })
        }
    },

    computed: {
        hintTickers() {
            return this.allTickers.filter((t) => t.FullName.toUpperCase().includes(this.ticker.toUpperCase())).slice(0, 4);
        },
        startIndex() {
            return this.$options.COUNT_ON_PAGE * (this.page - 1);
        },
        endIndex() {
            return this.$options.COUNT_ON_PAGE * this.page;
        },
        filteredTickers() {
            return this.tickers.filter((t) => t.name.includes(this.search.toUpperCase()))
        },
        paginatedTickers() {
            return this.filteredTickers.slice(this.startIndex, this.endIndex);
        },
        hasNextPage() {
            return this.filteredTickers.length > this.endIndex;
        },
        normalizedGraph() {
            const max = Math.max(...this.graph);
            const min = Math.min(...this.graph);

            if (max === min) {
                return this.graph.map(() => 50);
            }
            return this.graph.map(
                bar => 5 + ((bar - min) * 95) / (max - min)
            );
        },
        pageStateOptions() {
            return {
                page: this.page,
                search: this.search,
            }
        }
    },

    methods: {
        formatPrice(price) {
            if (typeof price !== "number") return "-";
            else return price > 1 ? price.toFixed(2) : price.toPrecision(2);
        },
        updateTickerPrice(tickerName, price) {
            this.tickers
                .filter(t => t.name === tickerName)
                .forEach(t =>  {
                    t.price = price
                });
        },
        pushToGraph(price) {
            this.graph.push(price);
            this.fixGraphLength();
        },
        addTicker(currency) {
            if (this.tickers.find((t) => t.name === currency.toUpperCase())) {
                this.isExistError = "Такой тикер уже добавлен";
            } else {
                const currentTicker = {name: currency.toUpperCase(), price: "-"};
                this.tickers = [...this.tickers, currentTicker];
                addTicker(currentTicker.name, (newPrice) => this.updateTickerPrice(currentTicker.name, newPrice));

                this.ticker = "";
                this.isExistError = null;
                this.search = "";
            }
        },
        deleteTicker(tickerToRemove) {
            this.tickers = this.tickers.filter(t => t !== tickerToRemove);
            deleteTicker(tickerToRemove.name);

            if (this.selectedTicker === tickerToRemove) {
                this.selectedTicker = null;
            }
        },
        selectTicker(tickerToSelect) {
            this.selectedTicker = tickerToSelect;
        },
        clearSelectedTicker() {
            this.selectedTicker = null
        },
        calculateMaxGraphElements() {
            if (!this.$refs.graph) return;
            this.maxGraphElements = Math.ceil(this.$refs.graph.offsetWidth / this.$options.GRAPH_ELEMENT_WIDTH);
        },
        fixGraphLength() {
            if (this.graph.length > this.maxGraphElements) {
                this.graph = this.graph.slice(this.graph.length - this.maxGraphElements);
            }
        },
        pushTickerHistoryToGraph(ticker) {
            loadTickerHistory(ticker, this.maxGraphElements - 1).then((history) => {
                history.Data.Data.forEach((priceData) => {
                    this.graph.push(priceData.open);
                })
            });
        }
    },

    watch: {
        tickers() {
            localStorage.setItem(this.$options.TICKERS_LS_KEY, JSON.stringify(this.tickers));
        },
        paginatedTickers() {
            if (this.paginatedTickers.length === 0 && this.page > 1) {
                this.page -= 1;
            }
        },
        selectedTicker(newValue, oldValue) {
            this.graph = [];

            if (oldValue) unsubscribeFromTicker(oldValue.name, this.pushToGraph);
            if (newValue) subscribeToTicker(newValue.name, this.pushToGraph);

            this.$nextTick().then(() => {
                this.calculateMaxGraphElements();
                if (newValue) {
                    this.pushTickerHistoryToGraph(newValue.name);
                }
            });
        },
        search() {
            this.page = 1;
        },
        pageStateOptions(v) {
            let urlParams = new URLSearchParams();
            urlParams.set("search", v.search);
            urlParams.set("page", v.page);

            window.history.pushState(
                null,
                document.title,
                `${window.location.pathname}?${urlParams.toString()}`
            );
        }
    }
}
</script>
