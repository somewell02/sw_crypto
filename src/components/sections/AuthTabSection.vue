<template>
    <section>
        <div class="flex">
            <div
                class="block text-gray-700 py-2 px-6 border-gray-300 rounded-t-md"
                :class="{
                    'border border-b-0': activeTab === 'auth',
                    'border-b cursor-pointer': activeTab !== 'auth'
                }"
                @click="setActiveTab('auth')"
            >
                Авторизация
            </div>
            <div
                class="block text-gray-700 py-2 px-6 border-gray-300 rounded-t-md"
                :class="{
                    'border border-b-0': activeTab === 'register',
                    'border-b cursor-pointer': activeTab !== 'register'
                }"
                @click="setActiveTab('register')"
            >
                Регистрация
            </div>
        </div>
        <div class="mt-6">
            <auth-form v-if="isActiveTab('auth')" />
            <register-form v-else-if="isActiveTab('register')" />
        </div>
    </section>
</template>

<script>
import AuthForm from "@/components/sections/AuthForm";
import RegisterForm from "@/components/sections/RegisterForm";

import { ref } from "vue";

export default {
    name: "AuthFormSection",
    components: {RegisterForm, AuthForm},

    setup() {
        const activeTab = ref("auth");
        const setActiveTab = key => activeTab.value = key;
        const isActiveTab = key => activeTab.value === key;

        return {
            activeTab,
            setActiveTab,
            isActiveTab
        };
    },
}
</script>