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
        <close-button @click="$emit('close')" />
    </section>
</template>

<script>
import CloseButton from "@/components/CloseButton";

import {loadTickerHistory, subscribeToTicker, unsubscribeFromTicker} from "@/data/api";

export default {
    GRAPH_ELEMENT_WIDTH: 38,

    name: "GraphSection",
    components: {
        CloseButton,
    },

    data() {
        return {
            graph: [],
            maxGraphElements: 1,
        }
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
}
</script>