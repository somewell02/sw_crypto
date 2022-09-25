<template>
    <form @submit.prevent="userAuth">
        <div class="flex">
            <div class="max-w-xs">
                <div class="relative rounded-md">
                    <bordered-input
                        v-model="registerForm.name.value"
                        type="text"
                        name="name"
                        id="name"
                        placeholder="Имя"
                        v-focus
                    />
                    <div v-if="registerForm.submitted" class="text-xs text-red-600 ml-1">
                        <template v-if="registerForm.name.errors.required"> Имя обязательно </template>
                    </div>
                </div>
                <div class="mt-4 relative rounded-md">
                    <bordered-input
                        v-model="registerForm.login.value"
                        :valid="!registerForm.submitted || registerForm.login.valid"
                        type="text"
                        name="login"
                        id="login"
                        placeholder="Логин"
                    />
                    <div v-if="registerForm.submitted" class="text-xs text-red-600 ml-1">
                        <template v-if="registerForm.login.errors.required"> Логин обязательный </template>
                    </div>
                </div>
                <div class="mt-4 relative rounded-md">
                    <bordered-input
                        v-model="registerForm.password.value"
                        :valid="!registerForm.submitted|| registerForm.password.valid"
                        type="password"
                        name="password"
                        id="password"
                        placeholder="Пароль"
                    />
                    <div v-if="registerForm.submitted" class="text-xs text-red-600 ml-1">
                        <template v-if="registerForm.password.errors.required"> Пароль обязательный </template>
                        <template v-else-if="registerForm.password.errors.minLength"> Минимальная длина пароля 6 символов </template>
                    </div>
                </div>
            </div>
        </div>
        <filled-button type="submit" class="mt-4">
            Зарегистрироваться
        </filled-button>
    </form>
</template>

<script>
import FilledButton from "@/components/buttons/FilledButton";
import BorderedInput from "@/components/inputs/BorderedInput";
import VFocus from "@/services/directives/VFocus";
import {useForm} from "@/use/form";

export default {
    name: "RegisterForm",

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

        const registerForm = useForm({
            name: {
                value: "",
                validators: { required },
            },
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
            registerForm.submitted = true;
            if (!registerForm.valid) return;

            console.log(registerForm.login.value, registerForm.password.value);
        }

        return {
            registerForm,
            userAuth,
        }
    },
}
</script>
