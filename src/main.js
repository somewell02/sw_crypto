import { createApp } from 'vue'
import App from './App.vue'

import './assets/css/tailwind.css'
import './assets/css/index.scss'

import router from "./router/router";
import store from "./data/store/vuex";

const app = createApp(App);
app.use(store).use(router).mount('#app')
