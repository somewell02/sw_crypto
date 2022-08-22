<template>
    <section>
        <div class="flex">
            <div class="max-w-xs">
                <h3 for="wallet" class="block text-lg font-medium text-gray-700"> Добавить тикер </h3>
                <div class="mt-4 relative rounded-md shadow-md">
                    <bordered-input
                        v-model="ticker"
                        @keydown.enter="addTicker(ticker)"
                        @input="isExistError = null"
                        name="wallet"
                        id="wallet"
                        placeholder="Например DOGE"
                        v-focus
                    />
                </div>
                <div
                    v-if="allTickers && hintTickers.length > 0 && ticker"
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
        <filled-button @click="addTicker(ticker)" class="mt-4">
            <add-icon/>
            Добавить
        </filled-button>
    </section>
</template>

<script>
import FilledButton from "@/components/FilledButton";
import BorderedInput from "@/components/BorderedInput";
import AddIcon from "@/assets/img/icons/AddIcon";
import VFocus from "@/directives/VFocus";

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

    data() {
        return {
            ticker: "",
            isExistError: null,
        }
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

    computed: {
        hintTickers() {
            return this.allTickers.filter((t) => t.FullName.toUpperCase().includes(this.ticker.toUpperCase())).slice(0, 4);
        },
    },

    methods: {
        addTicker(ticker) {
            if (ticker.length === 0) return;

            if (this.tickers.includes(ticker.toUpperCase())) {
                this.isExistError = "Такой тикер уже добавлен";
            } else {
                this.$emit("add-ticker", ticker);

                this.ticker = "";
                this.isExistError = null;
            }
        },
    },
}
</script>