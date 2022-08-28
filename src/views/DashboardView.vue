<template>
    <main class="w-full">
        <loader-screen ref="loaderScreen"/>
        <div class="container">
            <div class="flex justify-between items-center">
                <div class="flex items-center">
                    <filled-button
                        class="flex-shrink-0 mr-4"
                        @click="$refs.addTickerModal.open()"
                    >
                        Добавить тикер
                    </filled-button>

                    <modal-wrap ref="addTickerModal">
                        <add-ticker-section
                            :tickers="tickers.map(t => t.name)"
                            :allTickers="allTickers"
                            @add-ticker="addTicker"
                        />
                    </modal-wrap>

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
                        class="flex-shrink-0 mr-4"
                        @click="$refs.authModal.open()"
                    >
                        Вход / Регистрация
                    </filled-button>

                    <modal-wrap ref="authModal">
                        <auth-form-section />
                    </modal-wrap>
                </div>
            </div>

            <template v-if="tickers.length">
                <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3" ref="tickersList">
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
    </main>
</template>

<script>
import DeleteIcon from "@/assets/img/icons/DeleteIcon";
import LoaderScreen from "@/components/LoaderScreen";
import BorderedInput from "@/components/inputs/BorderedInput";
import FilledButton from "@/components/buttons/FilledButton";

import AddTickerSection from "@/components/sections/AddTickerSection";
import GraphSection from "@/components/sections/GraphSection";
import ModalWrap from "@/components/popups/ModalWrap";
import ConfirmPopup from "@/components/popups/ConfirmPopup";

import {
    addTicker,
    deleteTicker,
    loadAllTickers, subscribeToTicker,
} from "@/data/api";
import { channel } from "@/data/broadcast-channel";

import { getUrlParams, historyPushState } from "@/services/methods/url";
import { getFromLocalStorage, setToLocalStorage } from "@/services/methods/localstorage";
import AuthFormSection from "@/components/sections/AuthFormSection";

export default {
    COUNT_ON_PAGE: 9,
    TICKERS_LS_KEY: "crypto-list",

    name: 'DashboardView',
    components: {
        AuthFormSection,
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

            search: "",
            page: 1,
        }
    },

    created() {
        const windowData = getUrlParams();
        const VALID_KEYS = ["search", "page"];
        VALID_KEYS.forEach((key) => {
            if (windowData[key]) {
                this[key] = windowData[key];
            }
        });

        const tickersData = getFromLocalStorage(this.$options.TICKERS_LS_KEY);
        if (tickersData) {
            this.tickers = tickersData;
            this.tickers.forEach(t => {
                addTicker(t.name, (newPrice) => this.updateTickerPrice(t.name, newPrice));
            })
        }

        channel.addEventListener("message", (event) => {
            const { type, data } = event.data;
            switch (type) {
                case "add-ticker":
                    if (!this.tickers.map(t => t.name).includes(data.ticker)) {
                        this.tickers = [...this.tickers, {name: data.ticker, price: "-"}];
                        subscribeToTicker(data.ticker, (newPrice) => this.updateTickerPrice(data.ticker, newPrice));
                    }
                    break;
                case "delete-ticker":
                    this.tickers = this.tickers.filter(t => t.name !== data.ticker);
                    break;
            }
        });
    },

    async mounted() {
        const allTickersData = await loadAllTickers();
        this.allTickers = Object.values(allTickersData.Data);
        this.$refs.loaderScreen.close();
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
            setToLocalStorage(this.$options.TICKERS_LS_KEY, this.tickers);
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
            historyPushState({
                search: v.search,
                page: v.page
            });
        }
    }
}
</script>