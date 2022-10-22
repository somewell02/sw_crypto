<template>
    <section class="relative">
        <h3 class="text-lg leading-6 font-medium text-gray-900 my-8">
            {{ ticker }} - USD
        </h3>
        <div class="flex items-end border-gray-600 border-b border-l h-64" ref="graphSection">
            <div
                v-for="(bar, i) in normalizedGraph"
                :key="i"
                :style="{
                    height: `${bar}%`,
                    width: `${GRAPH_ELEMENT_WIDTH}px`
                }"
                class="bg-purple-800 border"
            ></div>
        </div>
    </section>
</template>

<script>
import {loadTickerHistory, subscribeToTicker, unsubscribeFromTicker} from "@/data/api";
import {onMounted, onBeforeUnmount, ref, computed, toRefs, watch, nextTick} from "vue";

export default {
    name: "GraphSection",

    props: {
        ticker: {
            type: String,
            required: true,
        },
    },

    setup(props) {
        const GRAPH_ELEMENT_WIDTH = 38;

        const graph = ref([]);
        const maxGraphElements = ref(1);
        const graphSection = ref(null);

        const normalizedGraph = computed(() => {
            const max = Math.max(...graph.value);
            const min = Math.min(...graph.value);

            if (max === min)
                return graph.value.map(() => 50);

            return graph.value.map(
                bar => 5 + ((bar - min) * 95) / (max - min)
            );
        });

        const fixGraphLength = () => {
            if (graph.value.length > maxGraphElements.value) {
                graph.value = graph.value.slice(graph.value.length - maxGraphElements.value);
            }
        }

        const pushToGraph = (price) => {
            graph.value.push(price);
            fixGraphLength();
        }

        const calculateMaxGraphElements = () => {
            if (!graphSection.value) return;
            maxGraphElements.value = Math.ceil(graphSection.value.offsetWidth / GRAPH_ELEMENT_WIDTH);
        }

        const pushTickerHistoryToGraph = (ticker) =>  {
            loadTickerHistory(ticker, maxGraphElements.value - 1).then((history) => {
                history.Data.Data.forEach((priceData) => {
                    graph.value.push(priceData.open);
                })
            });
        }

        watch(graph, fixGraphLength);

        onMounted(() => {
            window.addEventListener("resize", calculateMaxGraphElements);
            window.addEventListener("resize", fixGraphLength);

            subscribeToTicker(ticker.value, pushToGraph);
            nextTick().then(() => {
                calculateMaxGraphElements();
                if (ticker.value) {
                    pushTickerHistoryToGraph(ticker.value);
                }
            });
        });

        onBeforeUnmount(() => {
            window.removeEventListener("resize", calculateMaxGraphElements);
            window.removeEventListener("resize", fixGraphLength);
        });

        const { ticker } = toRefs(props);

        watch(ticker, (newValue, oldValue) => {
            graph.value = [];

            if (oldValue) unsubscribeFromTicker(oldValue, pushToGraph);
            if (newValue) subscribeToTicker(newValue, pushToGraph);

            nextTick().then(() => {
                calculateMaxGraphElements();
                if (newValue) {
                    pushTickerHistoryToGraph(newValue);
                }
            });
        });

        return {
            GRAPH_ELEMENT_WIDTH,
            graph,
            maxGraphElements,
            normalizedGraph,
            graphSection,
        }
    },
}
</script>