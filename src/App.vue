<template>
    <div class="w-full bg-gray-100 min-h-screen">
        <div class="container mx-auto flex flex-col items-center">
            <router-view />
        </div>
    </div>
</template>

<script>
export default {
    name: 'App',
}
</script>