<template>
    <section>
        <div class="flex">
            <div class="max-w-xs">
                <h3 for="wallet" class="block text-lg font-medium text-gray-700"> Авторизация </h3>
                <div class="mt-4 relative rounded-md">
                    <bordered-input
                        v-model="user.login"
                        type="text"
                        name="login"
                        id="login"
                        placeholder="Логин"
                        v-focus
                    />
                </div>
                <div class="mt-4 relative rounded-md">
                    <bordered-input
                        v-model="user.password"
                        type="password"
                        name="password"
                        id="password"
                        placeholder="Пароль"
                    />
                </div>
                <div class="text-sm text-red-600">{{  }}</div>
            </div>
        </div>
        <filled-button @click="userAuth" class="mt-4">
            Войти
        </filled-button>
    </section>
</template>

<script>
import FilledButton from "@/components/buttons/FilledButton";
import BorderedInput from "@/components/inputs/BorderedInput";
import VFocus from "@/services/directives/VFocus";

import {reactive} from "vue";

export default {
    name: "AuthFormSection",

    components: {
        FilledButton,
        BorderedInput,
    },

    directives: {
        "focus": VFocus,
    },

    setup() {
        const user = reactive({
            login: "",
            password: "",
        });

        const userAuth = () => {

        }

        return {
            user,
            userAuth,
        }
    },
}
</script>