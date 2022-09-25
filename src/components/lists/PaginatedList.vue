<template>
    <div class="paginated_list_wrap" @dragover="containerDragover">
        <transition-group name="tickers-list" tag="div" class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <ticker-card
                v-for="t in paginatedItems"
                :key="t.name"
                :ticker="t"
                @click="$emit('select', t)"
                @delete="$emit('delete', t)"
                @dragstart="tickerDragstart(t)"
                @dragover="e => tickerDragover(e, t)"
                :draggable="true"
                :class="{ 'outline': selectedTicker === t }"
            />
        </transition-group>
        <div class="flex mt-5 justify-between items-center">
            <div class="text-gray-500">
                {{ startIndex + 1 }} - {{
                    endIndex > items.length ? items.length : endIndex
                }} из {{ items.length }}
            </div>
            <filled-pagination v-model="page" :length="pagesLength" />
        </div>
    </div>
</template>

<script>
import TickerCard from "@/components/cards/TickerCard";
import FilledPagination from "@/components/paginations/FilledPagination";

import {computed, watch, toRefs, ref, onMounted} from "vue";
import {useDragAndDrop} from "@/use/drag-and-drop";
import {getUrlParams, historyPushState} from "@/services/methods/url";

export default {
    name: "PaginatedList",
    components: {
        FilledPagination,
        TickerCard,
    },

    props: {
        items: {
            type: Array,
            required: true,
        },
        countOnPage: {
            type: Number,
            required: false,
            default: 6,
        },
        selectedTicker: {
            type: Object,
            required: false,
        }
    },

    emits: {
        "select": null,
        "delete": null,
        "handleDragover": null,
    },

    setup(props, {emit}) {
        const { items, countOnPage } = toRefs(props);

        const page = ref(1);
        const pagesLength = computed(() => Math.ceil(items.value.length / countOnPage.value));

        onMounted(() => {
            const windowData = getUrlParams();
            if (windowData.page) {
                page.value = parseInt(windowData.page);
            }
        })
        watch(page,(v) => {
            historyPushState({
                page: v,
            });
        })

        const startIndex = computed(() => countOnPage.value * (page.value - 1));
        const endIndex = computed(() => countOnPage.value * page.value);
        const paginatedItems = computed(() => items.value.slice(startIndex.value, endIndex.value));

        watch(paginatedItems,() => {
            if (paginatedItems.value.length === 0 && page.value > 1) {
                page.value -= 1;
            }
        });

        const containerDragover = (e) => {
            if (page.value > 1 && e.screenX < 20) {
                page.value -= 1;
            } else if (page.value < pagesLength.value && e.screenX > window.innerWidth - 20) {
                page.value += 1;
            }
        };

        const handleDragover = (dragElement, newIndex) => emit("handleDragover", dragElement, newIndex);

        const {
            itemDragstart: tickerDragstart,
            itemDragover: tickerDragover
        } = useDragAndDrop({items}, handleDragover);

        return {
            page,
            pagesLength,
            startIndex,
            endIndex,
            paginatedItems,
            tickerDragstart,
            tickerDragover,
            containerDragover
        }
    },
}
</script>