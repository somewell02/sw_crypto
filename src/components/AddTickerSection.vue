<template>
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
</template>

<script>
import FilledButton from "@/components/FilledButton";
import BorderedInput from "@/components/BorderedInput";
import AddIcon from "@/assets/img/icons/AddIcon";
import {loadAllTickers} from "@/data/api";

export default {
    name: "AddTickerSection",
    components: {
        FilledButton,
        BorderedInput,
        AddIcon,
    },

    data() {
        return {
            ticker: "",
            allTickers: null,
            isExistError: null,
        }
    },

    props: {
      tickers: {
          type: Array,
          required: true,
      }
    },

    emits: {
        "data-received": null,
        "add-ticker": value => typeof value === "string" && value.length > 0,
    },

    async mounted() {
        const allTickersData = await loadAllTickers();
        this.allTickers = Object.values(allTickersData.Data);
        this.$emit("data-received");
    },

    computed: {
        hintTickers() {
            return this.allTickers.filter((t) => t.FullName.toUpperCase().includes(this.ticker.toUpperCase())).slice(0, 4);
        },
    },

    methods: {
        addTicker() {
            if (this.ticker.length === 0) return;

            if (this.tickers.includes(this.ticker.toUpperCase())) {
                this.isExistError = "Такой тикер уже добавлен";
            } else {
                this.$emit("add-ticker", this.ticker);

                this.ticker = "";
                this.isExistError = null;
            }
        },
    },
}
</script>