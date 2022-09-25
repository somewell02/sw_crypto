<template>
    <form @submit.prevent="userAuth">
        <div class="flex">
            <div class="max-w-xs">
                <div class="relative rounded-md">
                    <bordered-input
                        v-model="authForm.login.value"
                        :valid="!authForm.submitted || authForm.login.valid"
                        type="text"
                        name="login"
                        id="login"
                        placeholder="Логин"
                        v-focus
                    />
                    <div v-if="authForm.submitted" class="text-xs text-red-600 ml-1">
                        <template v-if="authForm.login.errors.required"> Логин обязательный </template>
                    </div>
                </div>
                <div class="mt-4 relative rounded-md">
                    <bordered-input
                        v-model="authForm.password.value"
                        :valid="!authForm.submitted|| authForm.password.valid"
                        type="password"
                        name="password"
                        id="password"
                        placeholder="Пароль"
                    />
                    <div v-if="authForm.submitted" class="text-xs text-red-600 ml-1">
                        <template v-if="authForm.password.errors.required"> Пароль обязательный </template>
                        <template v-else-if="authForm.password.errors.minLength"> Минимальная длина пароля 6 символов </template>
                    </div>
                </div>
            </div>
        </div>
        <filled-button type="submit" class="mt-4">
            Войти
        </filled-button>
    </form>
</template>

<script>
import FilledButton from "@/components/buttons/FilledButton";
import BorderedInput from "@/components/inputs/BorderedInput";
import VFocus from "@/services/directives/VFocus";
import {useForm} from "@/use/form";

export default {
    name: "AuthForm",

    components: {
        FilledButton,
        BorderedInput,
    },

    directives: {
        "focus": VFocus,
    },

    setup() {
        const required = val => !!val;
        const minLength = num => val => val.length >= num;

        const authForm = useForm({
            login: {
                value: "",
                validators: { required },
            },
            password: {
                value: "",
                validators: { required, minLength: minLength(6) },
            }
        });

        const userAuth = () => {
            authForm.submitted = true;
            if (!authForm.valid) return;

            console.log(authForm.login.value, authForm.password.value);
        }

        return {
            authForm,
            userAuth,
        }
    },
}
</script>
