<template>
    <div v-if="length > 1">
        <filled-button
            v-if="labels"
            :class="{ 'opacity-50': modelValue <= 1}"
            :disabled="modelValue <= 1"
            @click="changePage(modelValue - 1)"
        >
            Назад
        </filled-button>
        <filled-button
            v-for="num in length"
            :key="num"
            @click="changePage(num)"
            :class="{ 'opacity-50 outline-none ring-2 ring-offset-2 ring-gray-500': isActivePage(num)}"
            :disabled="isActivePage(num)"
            class="ml-4"
        >
            {{ num }}
        </filled-button>
        <filled-button
            v-if="labels"
            :class="{ 'opacity-50': !hasNextPage}"
            :disabled="!hasNextPage"
            @click="changePage(modelValue + 1)"
            class="ml-4"
        >
            Вперед
        </filled-button>
    </div>
</template>

<script>
import FilledButton from "@/components/buttons/FilledButton";
import {computed, toRefs} from "vue";

export default {
    name: "FilledPagination",
    components: {
        FilledButton,
    },

    props: {
        modelValue: {
            type: Number,
            required: true,
        },
        length: {
            type: Number,
            required: true,
        },
        labels: {
            type: Boolean,
            required: false,
            default: true,
        }
    },

    emits: {
        "update:modelValue": null,
    },

    setup(props, {emit}) {
        const {modelValue, length} = toRefs(props);

        const hasNextPage = computed(() => modelValue.value < length.value);
        const isActivePage = (num) => modelValue.value === num;
        const changePage = (num) => {
            if (num >= 1 && num <= length.value && num !== modelValue.value) {
                emit("update:modelValue", num);
            }
        }

        return {
            changePage,
            hasNextPage,
            isActivePage
        }
    }
}
</script>