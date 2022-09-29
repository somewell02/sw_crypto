<template>
    <form @submit.prevent="addTicker(addTickerForm.name.value)">
        <div class="flex">
            <div class="max-w-xs">
                <h3 for="wallet" class="block text-lg font-medium text-gray-700"> Добавить тикер </h3>
                <div class="mt-4 relative rounded-md">
                    <bordered-input
                        v-model="addTickerForm.name.value"
                        type="text"
                        name="wallet"
                        id="wallet"
                        placeholder="Например DOGE"
                        @input="addTickerForm.submitted = false"
                        v-focus
                    />
                </div>
                <div
                    v-if="hintTickers.length > 0 && addTickerForm.name.value"
                    class="flex bg-white py-1 rounded-md flex-wrap"
                >
                    <button
                        type="button"
                        v-for="t in hintTickers"
                        :key="t.Symbol"
                        @click="addHintTicker(t)"
                        class="inline-flex items-center px-2 m-1 rounded-md text-xs font-medium bg-gray-300 text-gray-800 cursor-pointer">
                      {{ t.Symbol }}
                    </button>
                </div>
                <div v-if="addTickerForm.submitted" class="text-xs text-red-600">
                    <template v-if="addTickerForm.name.errors.required"> Введите тикер </template>
                    <template v-else-if="addTickerForm.name.errors.notInclude"> Такой тикер уже добавлен </template>
                </div>
            </div>
        </div>
        <filled-button type="submit" class="mt-4">
            <add-icon />
            Добавить
        </filled-button>
    </form>
</template>

<script>
import FilledButton from "@/components/buttons/FilledButton";
import BorderedInput from "@/components/inputs/BorderedInput";
import AddIcon from "@/assets/img/icons/AddIcon";
import VFocus from "@/services/directives/VFocus";

import {computed, nextTick, toRefs} from "vue";
import {useForm} from "@/use/form";
import {mapGetters} from "@/services/methods/store";

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
    },

    emits: {
        "add-ticker": value => typeof value === "string" && value.length > 0,
    },

    setup(props, { emit }) {
        const { tickers } = toRefs(props);

        const required = val => !!val;
        const notInclude = val => !tickers.value.includes(val.toUpperCase());

        const addTickerForm = useForm({
            name: {
                value: "",
                validators: { required, notInclude },
            }
        });

        const addTicker = ticker => {
            addTickerForm.submitted = true;
            nextTick(() => {
                if (!addTickerForm.valid) return;

                emit("add-ticker", ticker);
                addTickerForm.name.value = "";
            })
        }

        const {
            "allTickers/getAllTickers": getAllTickers
        } = mapGetters();

        const hintTickers = computed(
            () => getAllTickers.value
                ? getAllTickers.value.filter(
                    (t) => t.FullName.toUpperCase().includes(addTickerForm.name.value.toUpperCase())
                ).slice(0, 4)
                : []
        );

        const addHintTicker = (t) => {
            addTickerForm.name.value = t.Symbol;
            addTicker(addTickerForm.name.value);
        }

        return {
            addTickerForm,
            addTicker,
            hintTickers,
            addHintTicker,
        }
    },
}
</script>