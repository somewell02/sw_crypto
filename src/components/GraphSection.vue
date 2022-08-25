<template>
    <section class="relative">
        <h3 class="text-lg leading-6 font-medium text-gray-900 my-8">
            {{ ticker }} - USD
        </h3>
        <div class="flex items-end border-gray-600 border-b border-l h-64" ref="graph">
            <div
                v-for="(bar, i) in normalizedGraph"
                :key="i"
                :style="{
                    height: `${bar}%`,
                    width: `${$options.GRAPH_ELEMENT_WIDTH}px`
                }"
                class="bg-purple-800 border"
            ></div>
        </div>
        <close-button @click="closeGraph" />
    </section>
</template>

<script>
import CloseButton from "@/components/CloseButton";

import {loadTickerHistory, subscribeToTicker, unsubscribeFromTicker} from "@/data/api";
//import {onMounted, onBeforeUnmount, ref, computed, toRefs, watch} from "vue";

export default {
    GRAPH_ELEMENT_WIDTH: 38,
    name: "GraphSection",
    components: {
        CloseButton,
    },

    props: {
        ticker: {
            type: String,
            required: true,
        },
    },

    emits: {
        "close": null,
    },

    data() {
        return {
            graph: [],
            maxGraphElements: 1,
        }
    },

    mounted() {
        window.addEventListener("resize", this.calculateMaxGraphElements);
        window.addEventListener("resize", this.fixGraphLength);
    },

    beforeUnmount() {
        window.removeEventListener("resize", this.calculateMaxGraphElements);
        window.removeEventListener("resize", this.fixGraphLength);
    },

    created() {
        subscribeToTicker(this.ticker, this.pushToGraph);
        this.$nextTick().then(() => {
            this.calculateMaxGraphElements();
            if (this.ticker) {
                this.pushTickerHistoryToGraph(this.ticker);
            }
        });
    },

    computed: {
        normalizedGraph() {
            const max = Math.max(...this.graph);
            const min = Math.min(...this.graph);

            if (max === min) {
                return this.graph.map(() => 50);
            }
            return this.graph.map(
                bar => 5 + ((bar - min) * 95) / (max - min)
            );
        },
    },

    methods: {
        pushToGraph(price) {
            this.graph.push(price);
            this.fixGraphLength();
        },
        calculateMaxGraphElements() {
            if (!this.$refs.graph) return;
            this.maxGraphElements = Math.ceil(this.$refs.graph.offsetWidth / this.$options.GRAPH_ELEMENT_WIDTH);
        },
        fixGraphLength() {
            if (this.graph.length > this.maxGraphElements) {
                this.graph = this.graph.slice(this.graph.length - this.maxGraphElements);
            }
        },
        pushTickerHistoryToGraph(ticker) {
            loadTickerHistory(ticker, this.maxGraphElements - 1).then((history) => {
                history.Data.Data.forEach((priceData) => {
                    this.graph.push(priceData.open);
                })
            });
        },
        closeGraph() {
            this.$emit("close");
        }
    },

    watch: {
        ticker(newValue, oldValue) {
            this.graph = [];

            if (oldValue) unsubscribeFromTicker(oldValue, this.pushToGraph);
            if (newValue) subscribeToTicker(newValue, this.pushToGraph);

            this.$nextTick().then(() => {
                this.calculateMaxGraphElements();
                if (newValue) {
                    this.pushTickerHistoryToGraph(newValue);
                }
            });
        },
        graph() {
            this.fixGraphLength();
        },
    }


    // setup(props, { emit }) {
    //     const GRAPH_ELEMENT_WIDTH = 38;
    //
    //     const graph = ref([]);
    //     const maxGraphElements = ref(1);
    //     const graphSection = ref(null);
    //
    //     const { ticker } = toRefs(props);
    //
    //     const normalizedGraph = computed(() => {
    //         const max = Math.max(...graph.value);
    //         const min = Math.min(...graph.value);
    //
    //         if (max === min) {
    //             return graph.value.map(() => 50);
    //         }
    //         return graph.value.map(
    //             bar => 5 + ((bar - min) * 95) / (max - min)
    //         );
    //     });
    //
    //     const fixGraphLength = () => {
    //         if (graph.value.length > maxGraphElements.value) {
    //             graph.value = graph.value.slice(graph.value.length - maxGraphElements.value);
    //         }
    //     }
    //
    //     const pushToGraph = (price) => {
    //         graph.value.push(price);
    //         fixGraphLength();
    //     }
    //
    //     const calculateMaxGraphElements = () => {
    //         if (!this.$refs.graphSection) return;
    //         maxGraphElements.value = Math.ceil(this.$refs.graph.offsetWidth / GRAPH_ELEMENT_WIDTH);
    //     }
    //
    //     const pushTickerHistoryToGraph = (ticker) =>  {
    //         loadTickerHistory(ticker, maxGraphElements.value - 1).then((history) => {
    //             history.Data.Data.forEach((priceData) => {
    //                 graph.value.push(priceData.open);
    //             })
    //         });
    //     }
    //
    //     const closeGraph = () => {
    //         emit("close");
    //     }
    //
    //     watch(() => ticker, (newValue, oldValue) => {
    //         graph.value = [];
    //
    //         if (oldValue) unsubscribeFromTicker(oldValue, pushToGraph);
    //         if (newValue) subscribeToTicker(newValue, pushToGraph);
    //
    //         this.$nextTick().then(() => {
    //             calculateMaxGraphElements();
    //             if (newValue) {
    //                 pushTickerHistoryToGraph(newValue);
    //             }
    //         });
    //     });
    //
    //     watch(() => graph, () => {
    //         fixGraphLength();
    //     });
    //
    //     onMounted(() => {
    //         window.addEventListener("resize", calculateMaxGraphElements);
    //         window.addEventListener("resize", fixGraphLength);
    //
    //         subscribeToTicker(ticker.value, pushToGraph);
    //         this.$nextTick().then(() => {
    //             calculateMaxGraphElements();
    //             if (ticker.value) {
    //                 pushTickerHistoryToGraph(ticker.value);
    //             }
    //         });
    //     });
    //
    //     onBeforeUnmount(() => {
    //         window.removeEventListener("resize", calculateMaxGraphElements);
    //         window.removeEventListener("resize", fixGraphLength);
    //     });
    //
    //     return {
    //         GRAPH_ELEMENT_WIDTH,
    //         graph,
    //         maxGraphElements,
    //         normalizedGraph,
    //         closeGraph,
    //     }
    // },
}
</script>