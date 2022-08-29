import { ref, reactive, watch, computed } from "vue";

export const useForm = (init = {}) => {
    const form = reactive({});

    for (const [key, value] of Object.entries(init)) {
        form[key] = useField(value);
    }

    const filterKeys = key => key !== "valid" && key !== "submitted";
    form.valid = computed(
        () =>  Object.keys(form)
            .filter(filterKeys)
            .reduce((_, key) =>  form[key].valid, true)
    )

    form.submitted = ref(false);

    return form;
}

export const useField = (field) => {
    const valid = ref(true);
    const value = ref(field.value);
    const errors = reactive({});

    const reassign = val => {
        valid.value = true;
        for (const [key, validate] of Object.entries(field.validators ?? {})) {
            const isValid = validate(val);
            errors[key] = !isValid;
            if (!isValid) valid.value = false;
        }
    }

    watch(value, reassign)
    reassign(value.value);

    return {
        value,
        valid,
        errors
    }
}