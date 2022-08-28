<template>
    <section>
        <div class="flex">
            <div class="max-w-xs">
                <h3 for="wallet" class="block text-lg font-medium text-gray-700"> Добавить тикер </h3>
                <div class="mt-4 relative rounded-md">
                    <bordered-input
                        v-model="ticker"
                        @keydown.enter="addTicker(ticker)"
                        @input="isExistError = null"
                        type="text"
                        name="wallet"
                        id="wallet"
                        placeholder="Например DOGE"
                        v-focus
                    />
                </div>
                <div
                    v-if="allTickers && hintTickers.length > 0 && ticker"
                    class="flex bg-white py-1 rounded-md flex-wrap"
                >
                    <button
                        v-for="t in hintTickers"
                        :key="t.Symbol"
                        @click="addTicker(t.Symbol)"
                        class="inline-flex items-center px-2 m-1 rounded-md text-xs font-medium bg-gray-300 text-gray-800 cursor-pointer">
                      {{ t.Symbol }}
                    </button>
                </div>
                <div v-if="isExistError" class="text-sm text-red-600">{{ this.isExistError }}</div>
            </div>
        </div>
        <filled-button @click="addTicker(ticker)" class="mt-4">
            <add-icon />
            Добавить
        </filled-button>
    </section>
</template>

<script>
import FilledButton from "@/components/buttons/FilledButton";
import BorderedInput from "@/components/inputs/BorderedInput";
import AddIcon from "@/assets/img/icons/AddIcon";
import VFocus from "@/services/directives/VFocus";

import {ref, computed, toRefs} from "vue";

export default {
    name: "AddTickerSection",
    components: {
        FilledButton,
        BorderedInput,
        AddIcon,
    },

    directives: {
        "focus": VFocus,
    },

    props: {
        tickers: {
            type: Array,
            required: true,
        },
        allTickers: {
            type: Array,
            required: false,
            default: null,
        },
    },

    emits: {
        "add-ticker": value => typeof value === "string" && value.length > 0,
    },

    setup(props, { emit }) {
        const ticker = ref("");
        const isExistError = ref(null);
        const { tickers, allTickers } = toRefs(props);

        const addTicker = (tickerToAdd) => {
            if (tickerToAdd.length === 0) return;

            if (tickers.value.includes(tickerToAdd.toUpperCase())) {
                isExistError.value = "Такой тикер уже добавлен";
            } else {
                emit("add-ticker", tickerToAdd);

                ticker.value = "";
                isExistError.value = null;
            }
        }

        const hintTickers = computed(
            () => allTickers.value.filter((t) => t.FullName.toUpperCase().includes(ticker.value.toUpperCase())).slice(0, 4)
        );

        return {
            ticker,
            isExistError,
            addTicker,
            hintTickers,
        }
    },
}
</script>