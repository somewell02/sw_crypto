<template>
    <div v-if="visible" class="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
        <div class="fixed z-10 inset-0 overflow-y-auto" @click="close">
            <div class="flex items-end sm:items-center justify-center min-h-full p-4 text-center sm:p-0">
                <div
                    class="relative bg-white p-8 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-sm sm:w-full"
                    @click.stop>
                    <slot></slot>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import {onBeforeUnmount, onMounted, ref} from "vue";

export default {
    name: "ModalWrap",

    setup() {
        const visible = ref(false);

        const open = () => visible.value = true;
        const close = () => visible.value = false;

        const handleKeydown = event => {
            if (event.key === "Escape" && this.visible) {
                this.visible = false;
            }
        }

        onMounted(() => {
            document.addEventListener("keydown", handleKeydown);
        })

        onBeforeUnmount(()=> {
            document.removeEventListener("keydown", handleKeydown);
        })

        return {
            visible,
            open,
            close,
        }
    },
}
</script>