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
                <paginated-list
                    :items="filteredTickers"
                    :countOnPage="$options.COUNT_ON_PAGE"
                    :selectedTicker="selectedTicker"
                    @select="selectTicker"
                    @delete="deleteTicker"
                    @handleDragover="handleDragover"
                />
                <confirm-popup ref="confirmPopup"/>
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
import AuthFormSection from "@/components/sections/AuthTabSection";
import PaginatedList from "@/components/lists/PaginatedList";

import {
    addTicker,
    deleteTicker,
    loadAllTickers, subscribeToTicker,
} from "@/data/api";
import {channel} from "@/data/broadcast-channel";

import {getUrlParams, historyPushState} from "@/services/methods/url";
import {getFromLocalStorage, setToLocalStorage} from "@/services/methods/localstorage";

export default {
    COUNT_ON_PAGE: 9,
    TICKERS_LS_KEY: "crypto-list",

    name: 'DashboardView',
    components: {
        PaginatedList,
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

            search: "",
        }
    },

    created() {
        const windowData = getUrlParams();
        const VALID_KEYS = ["search"];
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
    },

    async mounted() {
        channel.addEventListener("message", this.handleTickersOnMessage);

        const allTickersData = await loadAllTickers();
        this.allTickers = Object.values(allTickersData.Data);
        this.$refs.loaderScreen.close();
    },

    beforeUnmount() {
        channel.removeEventListener("message", this.handleTickersOnMessage);
    },

    computed: {
        filteredTickers() {
            return this.tickers.filter((t) => t.name.includes(this.search.toUpperCase()))
        },
    },

    methods: {
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
        handleTickersOnMessage(event) {
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
        },
        handleDragover(dragElement, newIndex) {
            this.tickers = this.tickers.filter(t => t !== dragElement);
            this.tickers.splice(newIndex, 0, dragElement);
        }
    },

    watch: {
        tickers: {
            handler() {
                setToLocalStorage(this.$options.TICKERS_LS_KEY, this.tickers);
            },
            deep: true,
        },
        search(v) {
            historyPushState({
                search: v,
            });
        },
    }
}
</script>

<style lang="scss">
.tickers-list-move {
    transition: transform 0.5s ease;
}
</style>