import {reactive, ref} from "vue";

export const useDragAndDrop = (init, handleDragover) => {
    let dragElement = reactive({});
    const dragActive = ref(false);

    const itemDragstart = (item) => {
        dragElement = item;
    }

    const itemDragover = ({target, screenX}, ticker) => {
        if (ticker === dragElement || dragActive.value) return;

        const elementIndex = init.items.value.indexOf(dragElement);
        const placeholderIndex = init.items.value.indexOf(ticker);
        const placeholderCenterPointX = target.getBoundingClientRect().x + target.offsetWidth / 2;

        const newIndex = placeholderIndex + (
            screenX > placeholderCenterPointX
                ? (elementIndex < placeholderIndex ? 0 : 1)
                : (elementIndex < placeholderIndex ? -1 : 0)
        );


        if (elementIndex !== newIndex) {
            dragActive.value = true;
            setTimeout(() => dragActive.value = false, 500);

            handleDragover(dragElement, newIndex);
        }
    }

    return {
        itemDragstart,
        itemDragover
    }
}