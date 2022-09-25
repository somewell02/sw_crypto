<template>
    <modal-wrap ref="modal">
        <h3 class="text-xl font-medium text-gray-700 text-center"> {{ title }} </h3>
        <div class="flex mt-6 w-100">
            <filled-button class="flex-1 mr-2" @click="confirm" v-focus>Да</filled-button>
            <filled-button class="flex-1 ml-2" @click="close">Отмена</filled-button>
        </div>
    </modal-wrap>
</template>

<script>
import ModalWrap from "@/components/popups/ModalWrap";
import FilledButton from "@/components/buttons/FilledButton";
import VFocus from "@/services/directives/VFocus";
import {ref} from "vue";

export default {
    name: "ConfirmPopup",
    components: {FilledButton, ModalWrap},

    directives: {
        "focus": VFocus,
    },

    setup() {
        let popupController = null;
        
        const title = ref("");
        const modal = ref(null);

        const open = (t = "Вы уверены?") => {
            let resolve;
            let reject;

            const popupPromise = new Promise((ok, fail) => {
                resolve = ok;
                reject = fail;
            });

            popupController = { resolve, reject };

            modal.value.open();
            title.value = t;

            return popupPromise;
        }

        const confirm = () => {
            popupController.resolve(true);
            modal.value.close();
        }

        const close = () => {
            popupController.resolve(false);
            modal.value.close();
        }

        return {
            title,
            modal,
            open,
            confirm,
            close,
        }
    },
}
</script>