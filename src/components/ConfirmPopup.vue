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
import ModalWrap from "@/components/ModalWrap";
import FilledButton from "@/components/FilledButton";
import VFocus from "@/directives/VFocus";

export default {
    popupController: null,

    name: "ConfirmPopup",
    components: {FilledButton, ModalWrap},

    directives: {
        "focus": VFocus,
    },

    data() {
        return {
            title: "",
        }
    },

    methods: {
        open(title = "Вы уверены?") {
            let resolve;
            let reject;

            const popupPromise = new Promise((ok, fail) => {
                resolve = ok;
                reject = fail;
            });

            this.$options.popupController = { resolve, reject };

            this.$refs.modal.open();
            this.title = title;

            return popupPromise;
        },
        confirm() {
            this.$options.popupController.resolve(true);
            this.$refs.modal.close();
        },
        close() {
            this.$options.popupController.resolve(false);
            this.$refs.modal.close();
        },
    },
}
</script>