import { createRouter, createWebHistory } from "vue-router";

const routes = [
    {
        path: "/",
        name: "dashboard",
        component: () => import("@/views/DashboardView"),
    },
    {
        path: "/ticker/:id",
        name: "tickerPage",
        component: () => import("@/views/TickerView"),
    },
];

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes,
});

export default router;