<template>
    <main class="w-full">
        <loader-screen ref="loaderScreen"/>
        <div class="container">
            <div class="flex justify-between items-center pt-4 pr-4 pl-4">
                <div class="flex items-center">
                    <filled-button
                        class="flex-shrink-0 mr-4"
                        @click="addTickerModal.open()"
                    >
                        Добавить тикер
                    </filled-button>

                    <modal-wrap ref="addTickerModal">
                        <add-ticker-section
                            :tickers="tickers.map(t => t.name)"
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
                <auth-button-section/>
            </div>

            <template v-if="tickers.length">
                <paginated-list
                    :items="filteredTickers"
                    :countOnPage="COUNT_ON_PAGE"
                    :selectedTicker="selectedTicker"
                    @select="selectTicker"
                    @delete="deleteTicker"
                    @handleDragover="handleDragover"
                    class="pr-4 pl-4"
                />
                <confirm-popup ref="confirmPopup"/>
            </template>
            <template v-if="selectedTicker">
                <hr class="border-t border-gray-600 m-4"/>
                <graph-section :ticker="selectedTicker.name" @close="clearSelectedTicker" class="mb-4 mx-4"/>
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
import PaginatedList from "@/components/lists/PaginatedList";
import AuthButtonSection from "@/components/sections/auth/AuthButtonSection";

import {
    addTicker as addTickerToWS,
    deleteTicker as deleteTickerFromWS,
    subscribeToTicker,
} from "@/data/api";
import {channel} from "@/data/broadcast-channel";

import {getUrlParams, historyPushState} from "@/services/methods/url";
import {getFromLocalStorage, setToLocalStorage} from "@/services/methods/localstorage";
import {computed, onBeforeMount, onBeforeUnmount, onMounted, ref, nextTick, watch} from "vue";
import {mapActions} from "@/services/methods/store";

export default {
    name: 'DashboardView',
    components: {
        AuthButtonSection,
        PaginatedList,
        ConfirmPopup,
        ModalWrap,
        GraphSection,
        AddTickerSection,
        FilledButton,
        BorderedInput,
        LoaderScreen
    },

    setup() {
        const COUNT_ON_PAGE = 9;
        const TICKERS_LS_KEY = "crypto-list";

        const tickers = ref([]);
        const selectedTicker = ref(null);
        watch(() => tickers.value, () => {
            setToLocalStorage(TICKERS_LS_KEY, tickers.value);
        }, {deep: true})

        const search = ref("");
        watch(() => search.value, (v) => {
            historyPushState({
                search: v,
            })
        })

        const addTickerModal = ref(null);
        const loaderScreen = ref(null);
        const confirmPopup = ref(null);

        const {
            "allTickers/fetchAllTickers": fetchAllTickers
        } = mapActions();

        onBeforeMount(() => {
            const windowData = getUrlParams();
            if (windowData.search) {
                search.value = windowData.search;
            }

            const tickersData = getFromLocalStorage(TICKERS_LS_KEY);
            if (tickersData) {
                tickers.value = tickersData;
                tickers.value.forEach(t => {
                    addTickerToWS(t.name, (newPrice) => updateTickerPrice(t.name, newPrice));
                })
            }
        })

        onMounted(async () => {
            channel.addEventListener("message", handleTickersOnMessage);

            await fetchAllTickers();
            nextTick().then(() => {
                loaderScreen.value.close();
            })
        })

        onBeforeUnmount(() => {
            channel.removeEventListener("message", handleTickersOnMessage);
        })

        const filteredTickers = computed(() => [...tickers.value].filter((t) => t.name.includes(search.value.toUpperCase())));

        const updateTickerPrice = (tickerName, price) => {
            tickers.value
                .filter(t => t.name === tickerName)
                .forEach(t => {
                    t.price = price
                });
        }

        const addTicker = currency => {
            const currentTicker = {name: currency.toUpperCase(), price: "-"};
            tickers.value = [...tickers.value, currentTicker];
            addTickerToWS(currentTicker.name, (newPrice) => updateTickerPrice(currentTicker.name, newPrice));

            nextTick().then(() => {
                addTickerModal.value.close();
            })
            search.value = "";
        }

        const deleteTicker = async tickerToRemove => {
            const confirmRes = await confirmPopup.value.open(`Вы уверены, что хотите удалить тикер ${tickerToRemove.name}?`);
            if (confirmRes) {
                tickers.value = tickers.value.filter(t => t !== tickerToRemove);
                deleteTickerFromWS(tickerToRemove.name);
            }

            if (selectedTicker.value === tickerToRemove) {
                selectedTicker.value = null;
            }
        }

        const selectTicker = tickerToSelect => selectedTicker.value = tickerToSelect;
        const clearSelectedTicker = () => selectedTicker.value = null;

        const handleTickersOnMessage = event => {
            const {type, data} = event.data;
            switch (type) {
                case "add-ticker":
                    if (!tickers.value.map(t => t.name).includes(data.ticker)) {
                        tickers.value = [...tickers.value, {name: data.ticker, price: "-"}];
                        subscribeToTicker(data.ticker, (newPrice) => updateTickerPrice(data.ticker, newPrice));
                    }
                    break;
                case "delete-ticker":
                    tickers.value = tickers.value.filter(t => t.name !== data.ticker);
                    break;
            }
        }

        const handleDragover = (dragElement, newIndex) => {
            tickers.value = tickers.value.filter(t => t !== dragElement);
            tickers.value.splice(newIndex, 0, dragElement);
        }


        return {
            COUNT_ON_PAGE,
            TICKERS_LS_KEY,
            tickers,
            selectedTicker,
            search,
            addTickerModal,
            loaderScreen,
            confirmPopup,
            filteredTickers,
            addTicker,
            selectTicker,
            deleteTicker,
            handleDragover,
            clearSelectedTicker,
        }
    },
}
</script>

<style lang="scss">
.tickers-list-move {
    transition: transform 0.5s ease;
}
</style>