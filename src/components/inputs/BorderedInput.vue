<template>
    <input
        class="block w-full pr-10 border-gray-300 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md"
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
        }
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
