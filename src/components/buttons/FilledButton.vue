<template>
    <button
        type="button"
        class="inline-flex items-center justify-center py-2 px-4 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
    >
        <slot />
    </button>
</template>

<script>
export default {
    name: "filled-button"
}
</script>
