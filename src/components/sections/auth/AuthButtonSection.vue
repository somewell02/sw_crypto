<template>
    <div>
        <filled-button
            class="flex-shrink-0 mr-4"
            @click="authModal.open()"
        >
            Вход / Регистрация
        </filled-button>

        <modal-wrap ref="authModal">
            <auth-tab-section />
        </modal-wrap>
    </div>
</template>

<script>
import AuthTabSection from "@/components/sections/auth/AuthTabSection";
import FilledButton from "@/components/buttons/FilledButton";
import ModalWrap from "@/components/popups/ModalWrap";

import {ref} from "vue";

export default {
    name: "AuthButtonSection",
    components: {
        AuthTabSection,
        FilledButton,
        ModalWrap,
    },

    setup() {
        const authModal = ref(null);

        return {
            authModal,
        }
    }
}
</script>