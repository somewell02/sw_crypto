export const historyPushState = (params) => {
    const windowData = getUrlParams();

    const urlParams = new URLSearchParams();
    Object.entries(windowData).forEach(([key, value]) => urlParams.set(key, value));
    Object.entries(params).forEach(([key, value]) => urlParams.set(key, value));

    window.history.pushState(
        null,
        document.title,
        `${window.location.pathname}?${urlParams.toString()}`
    );
}

export const getUrlParams = () => {
    return Object.fromEntries(new URL(window.location).searchParams.entries());
}