<template>
    <div class="container mx-auto flex flex-col items-center bg-gray-100 p-4">
        <loader-screen v-if="loading"/>
        <div class="container">
            <modal-wrap ref="addTickerModal">
                <add-ticker-section
                    :tickers="tickers.map(t => t.name)"
                    :allTickers="allTickers"
                    @add-ticker="addTicker"
                />
            </modal-wrap>

            <template v-if="tickers.length">
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
                        <filled-button
                            @click="$refs.addTickerModal.open()"
                        >
                            Добавить тикер
                        </filled-button>
                    </div>
                </div>
                <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <div
                        v-for="(t, i) in paginatedTickers"
                        :key="i"
                        @click="selectTicker(t)"
                        class="overflow-hidden shadow rounded-lg outline-purple-800 cursor-pointer"
                        :class="{
                            'outline': selectedTicker === t,
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
                    <confirm-popup ref="confirmPopup" />
                </dl>
                <div class="flex mt-5 justify-between items-center">
                    <div class="text-gray-500">
                        {{ startIndex + 1 }} - {{ endIndex > filteredTickers.length ? filteredTickers.length : endIndex }} из {{ filteredTickers.length }}
                    </div>
                    <div>
                        <filled-button
                            :class="{ 'opacity-50': page <= 1}"
                            :disabled="page <= 1"
                            @click="page--"
                        >
                            Назад
                        </filled-button>
                        <filled-button
                            :class="{ 'opacity-50': !hasNextPage}"
                            :disabled="!hasNextPage"
                            @click="page++"
                            class="ml-4"
                        >
                            Вперед
                        </filled-button>
                    </div>
                </div>
            </template>
            <template v-if="selectedTicker">
                <hr class="w-full border-t border-gray-600 my-4"/>
                <graph-section :ticker="selectedTicker.name" @close="clearSelectedTicker"/>
            </template>
        </div>
    </div>
</template>

<script>
import DeleteIcon from "@/assets/img/icons/DeleteIcon";
import LoaderScreen from "@/components/LoaderScreen";
import BorderedInput from "@/components/BorderedInput";
import FilledButton from "@/components/FilledButton";

import AddTickerSection from "@/components/AddTickerSection";
import GraphSection from "@/components/GraphSection";
import ModalWrap from "@/components/ModalWrap";

import {
    addTicker,
    deleteTicker,
    loadAllTickers,
} from "@/data/api";
import ConfirmPopup from "@/components/ConfirmPopup";

export default {
    COUNT_ON_PAGE: 6,
    TICKERS_LS_KEY: "crypto-list",

    name: 'App',
    components: {
        ConfirmPopup,
        ModalWrap,
        GraphSection,
        AddTickerSection,
        FilledButton,
        BorderedInput,
        LoaderScreen,
        DeleteIcon
    },

    data() {
        return {
            tickers: [],
            allTickers: null,
            selectedTicker: null,

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

        const tickersData = localStorage.getItem(this.$options.TICKERS_LS_KEY);
        if (tickersData) {
            this.tickers = JSON.parse(tickersData);
            this.tickers.forEach(t => {
                addTicker(t.name, (newPrice) => this.updateTickerPrice(t.name, newPrice));
            })
        }
    },

    computed: {
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
                .forEach(t => {
                    t.price = price
                });
        },
        addTicker(currency) {
            const currentTicker = {name: currency.toUpperCase(), price: "-"};
            this.tickers = [...this.tickers, currentTicker];
            addTicker(currentTicker.name, (newPrice) => this.updateTickerPrice(currentTicker.name, newPrice));

            this.$refs.addTickerModal.close()
            this.search = "";
        },
        async deleteTicker(tickerToRemove) {
            const confirmRes = await this.$refs.confirmPopup.open(`Вы уверены, что хотите удалить тикер ${tickerToRemove.name}?`);
            if (confirmRes) {
                this.tickers = this.tickers.filter(t => t !== tickerToRemove);
                deleteTicker(tickerToRemove.name);
            }

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