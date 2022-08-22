<template>
    <button
        type="button"
        class="absolute top-0 right-0"
    >
        <close-icon/>
    </button>
</template>

<script>
import CloseIcon from "@/assets/img/icons/CloseIcon";

export default {
    name: "CloseButton",
    components: {CloseIcon},
}
</script>