export const setToLocalStorage = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
}

export const getFromLocalStorage = (key) => {
    const data = localStorage.getItem(key);
    if (data) return JSON.parse(data);
    else return null;
}