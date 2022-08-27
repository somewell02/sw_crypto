import { createApp } from 'vue'
import App from './App.vue'

import './assets/css/tailwind.css'
import './assets/css/index.scss'

import router from "./router/router";

const app = createApp(App);
app.use(router).mount('#app')
