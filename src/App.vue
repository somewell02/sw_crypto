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
                        class="bg-white overflow-hidden shadow rounded-lg border-purple-800 border-solid cursor-pointer"
                        :class="{ 'border-4': selectedTicker === t }"
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
                    <div class="flex items-end border-gray-600 border-b border-l h-64">
                        <div
                            v-for="(bar, i) in normalizedGraph"
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
import BorderedInput from "@/components/BorderedInput";
import FilledButton from "@/components/FilledButton";

import {loadAllTickers, subscribeToTicker, unsubscribeFromTicker} from "@/data/api";

export default {
    name: 'App',
    components: {FilledButton, BorderedInput, LoaderScreen, AddIcon, DeleteIcon, CloseIcon},
    data() {
        return {
            ticker: "",
            tickers: [],
            allTickers: null,
            selectedTicker: null,
            graph: [],
            isExistError: null,
            loading: true,
            search: "",
            page: 1,
        }
    },

    async mounted() {
        const allTickersData = await loadAllTickers();
        this.allTickers = Object.values(allTickersData.Data);
        this.loading = false;
    },

    created() {
        const windowData = Object.fromEntries(new URL(window.location).searchParams.entries());
        const VALID_KEYS = ["search", "page"];
        VALID_KEYS.forEach((key) => {
            if (windowData[key]) {
                this[key] = windowData[key];
            }
        });


        const tickersData = localStorage.getItem("crypto-list");
        if (tickersData) {
            this.tickers = JSON.parse(tickersData);
            this.tickers.forEach(t => {
                subscribeToTicker(t.name, (newPrice) => this.updateTicker(t.name, newPrice));
            })
        }
    },

    computed: {
        hintTickers() {
            return this.allTickers.filter((t) => t.FullName.toUpperCase().includes(this.ticker.toUpperCase())).slice(0, 4);
        },
        startIndex() {
            return 6 * (this.page - 1);
        },
        endIndex() {
            return 6 * this.page;
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
        isTickerExist(currency) {
            return this.allTickers.find((t) => t.Symbol === currency.toUpperCase());
        },
        formatPrice(price) {
            if (typeof price !== "number") return price;
            else return price > 1 ? price.toFixed(2) : price.toPrecision(2);
        },
        updateTicker(tickerName, price) {
            this.tickers
                .filter(t => t.name === tickerName)
                .forEach(t => t.price = price);

            // if (this.selectedTicker?.name === tickerName) {
            //     this.graph.push(exchangeData.USD);
            // }
        },
        addTicker(currency) {
            if (!this.isTickerExist(currency)) {
                this.isExistError = "Такого тикера не существует";
            } else if (this.tickers.find((t) => t.name === currency.toUpperCase())) {
                this.isExistError = "Такой тикер уже добавлен";
            } else {
                const currentTicker = {name: currency.toUpperCase(), price: "-"};
                this.tickers = [...this.tickers, currentTicker];
                subscribeToTicker(currentTicker.name, (newPrice) => this.updateTicker(currentTicker.name, newPrice));

                this.ticker = "";
                this.isExistError = null;
                this.search = "";
                this.page = 1;
            }
        },
        deleteTicker(tickerToRemove) {
            this.tickers = this.tickers.filter(t => t !== tickerToRemove);
            unsubscribeFromTicker(tickerToRemove.name)

            if (this.selectedTicker === tickerToRemove) {
                this.selectedTicker = null;
            }
        },
        selectTicker(tickerToSelect) {
            this.selectedTicker = tickerToSelect;
        },
        clearSel() {
            this.selectedTicker = null
        }
    },

    watch: {
        tickers() {
            localStorage.setItem("crypto-list", JSON.stringify(this.tickers));
        },
        paginatedTickers() {
            if (this.paginatedTickers.length === 0 && this.page > 1) {
                this.page -= 1;
            }
        },
        selectedTicker() {
            this.graph = [];
        },
        search() {
            this.page = 1;
        },
        pageStateOptions(v) {
            window.history.pushState(
                null,
                document.title,
                `${window.location.pathname}?search=${v.search}&page=${v.page}`
            );
        }
    }
}
</script>
