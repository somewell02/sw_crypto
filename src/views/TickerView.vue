<template>
    <main class="w-full">
        <loader-screen ref="loaderScreen"/>
        <div class="container p-4" v-if="tickerData">
            <div class="flex w-full">
                <div class="ticker_main grow shrink-0">
                    <div class="ticker_header">
                        <div class="ticker_info flex items-center">
                            <div class="ticker_img w-14">
                                <img :src="tickerImgUrl" :alt="tickerData.Symbol">
                            </div>
                            <div class="ticker_symbol text-xl font-bold ml-3">
                                {{ TICKER_SYMBOL }}
                            </div>
                        </div>
                    </div>
                    <div class="ticker_graph">
                        <graph-section :ticker="TICKER_SYMBOL"/>
                    </div>
                </div>
                <div class="ticker_exchange grow-0 shrink-0 basis-1/3">

                </div>
            </div>
        </div>
    </main>
</template>

<script>
import LoaderScreen from "@/components/LoaderScreen";
import GraphSection from "@/components/sections/GraphSection";

import {computed, nextTick, onMounted, ref} from "vue";
import {useRoute} from 'vue-router';
import {API_SITE_URL, getTickerData} from "@/data/api";

export default {
    name: 'TickerView',
    components: {
        GraphSection,
        LoaderScreen
    },

    setup() {
        const route = useRoute()
        const loaderScreen = ref(null);
        const TICKER_SYMBOL = route.params.id.toUpperCase();

        const tickerData = ref(null);
        const tickerImgUrl = computed(() => tickerData.value ? API_SITE_URL + tickerData.value.ImageUrl : "");

        onMounted(async () => {
            tickerData.value = await getTickerData(TICKER_SYMBOL)
            nextTick().then(() => {
                loaderScreen.value.close();
            })
        })

        return {
            tickerData,
            tickerImgUrl,
            loaderScreen,
            TICKER_SYMBOL
        }
    }
}
</script>