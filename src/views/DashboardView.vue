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
                        <auth-form-section/>
                    </modal-wrap>
                </div>
            </div>

            <template v-if="tickers.length">
                <transition-group name="flip-list" tag="div" class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <ticker-card
                        v-for="t in paginatedTickers"
                        :key="t.name"
                        :ticker="t"
                        @click="selectTicker(t)"
                        @delete="deleteTicker(t)"
                        @dragstart="tickerDragstart(t)"
                        @dragover="e => tickerDragover(e, t)"
                        :draggable="true"
                        :class="{ 'outline': selectedTicker === t }"
                    />
                </transition-group>
                <confirm-popup ref="confirmPopup"/>
                <div class="flex mt-5 justify-between items-center">
                    <div class="text-gray-500">
                        {{ startIndex + 1 }} - {{
                            endIndex > filteredTickers.length ? filteredTickers.length : endIndex
                        }} из {{ filteredTickers.length }}
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
import {channel} from "@/data/broadcast-channel";

import {getUrlParams, historyPushState} from "@/services/methods/url";
import {getFromLocalStorage, setToLocalStorage} from "@/services/methods/localstorage";
import AuthFormSection from "@/components/sections/AuthTabSection";
import TickerCard from "@/components/cards/TickerCard";

export default {
    COUNT_ON_PAGE: 9,
    TICKERS_LS_KEY: "crypto-list",

    name: 'DashboardView',
    components: {
        TickerCard,
        AuthFormSection,
        ConfirmPopup,
        ModalWrap,
        GraphSection,
        AddTickerSection,
        FilledButton,
        BorderedInput,
        LoaderScreen
    },

    data() {
        return {
            tickers: [],
            allTickers: null,
            selectedTicker: null,

            dragElement: null,
            dragActive: false,

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
            const {type, data} = event.data;
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
        tickerDragstart(ticker) {
            this.dragElement = ticker;
        },
        tickerDragover({target, screenX}, ticker) {
            if (ticker === this.dragElement || this.dragActive) return;

            const elementIndex = this.tickers.indexOf(this.dragElement);
            const placeholderIndex = this.tickers.indexOf(ticker);
            const placeholderCenterPointX = target.offsetLeft + target.offsetWidth / 2;

            const newIndex = placeholderIndex + (
                screenX > placeholderCenterPointX
                    ? (elementIndex < placeholderIndex ? 0 : 1)
                    : (elementIndex < placeholderIndex ? -1 : 0)
            );


            if (elementIndex !== newIndex) {
                this.dragActive = true;
                setTimeout(() => this.dragActive = false, 500);

                this.tickers = this.tickers.filter(t => t !== this.dragElement);
                this.tickers.splice(newIndex, 0, this.dragElement);
            }
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
        tickers: {
            handler() {
                setToLocalStorage(this.$options.TICKERS_LS_KEY, this.tickers);
            },
            deep: true,
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

<style lang="scss">
.flip-list-move {
    transition: transform 0.5s ease;
}
</style>