<template>
    <div
        class="overflow-hidden shadow rounded-lg outline-purple-800 cursor-pointer relative"
        :class="{
            'bg-white': ticker.price !== '-',
            'bg-red-100': ticker.price === '-',
        }"
        :draggable="draggable"
        ref="tickerCard"
    >
        <drag-icon v-if="draggable" class="absolute top-2 right-4 w-6 h-6 pointer-events-none"></drag-icon>
        <div class="px-4 py-5 sm:p-6 text-center pointer-events-none">
            <dt class="text-sm font-medium text-gray-500 truncate pointer-events-none">
                {{ ticker.name }} - USD
            </dt>
            <dd class="mt-1 text-3xl font-semibold text-gray-900 pointer-events-none">
                {{ formatPrice(ticker.price) }}
            </dd>
        </div>
        <div class="w-full border-t border-gray-200 pointer-events-none"></div>
        <button
            @click.stop="$emit('delete')"
            @dragover.prevent="e => $emit('dragover', { target: $refs.tickerCard, screenX: e.screenX })"
            class="flex items-center justify-center font-medium w-full bg-gray-100 px-4 py-4 sm:px-6 text-md text-gray-500 hover:text-gray-600 hover:bg-gray-200 hover:opacity-20 transition-all focus:outline-none"
        >
            <delete-icon class="pointer-events-none" />
            Удалить
        </button>
    </div>
</template>

<script>
import DeleteIcon from "@/assets/img/icons/DeleteIcon";
import DragIcon from "@/assets/img/icons/DragIcon";
export default {
    name: "TickerCard",
    components: {DragIcon, DeleteIcon },

    props: {
        ticker: {
            type: Object,
            required: true,
        },
        draggable: {
            type: Boolean,
            required: false,
            default: false,
        }
    },

    methods: {
        formatPrice(price) {
            if (typeof price !== "number") return "-";
            else return price > 1 ? price.toFixed(2) : price.toPrecision(2);
        },
    }
}
</script>