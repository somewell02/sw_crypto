<template>
    <input
        class="block w-full pr-10 text-gray-900 focus:outline-none sm:text-sm rounded-md"
        :class="{
            'border-gray-300 focus:ring-gray-500 focus:border-gray-500': valid,
            'border-red-300 focus:ring-red-500 focus:border-red-500': !valid,
        }"
        :value="modelValue ?? ''"
        @input="updateInput"
    />
</template>

<script>
export default {
    name: "BorderedInput",
    props: {
        modelValue: {
            type: String,
            required: true,
        },
        valid: {
            type: Boolean,
            required: false,
            default: true,
        },
    },
    setup(props, { emit }) {
        const updateInput = (event) => {
            emit("update:modelValue", event.target.value);
        }

        return {
            updateInput,
        }
    }
}
</script>
