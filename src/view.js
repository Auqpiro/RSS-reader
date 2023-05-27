import onChange from 'on-change';

export default (elements, state) => {
  const { input, errorField } = elements;
  const watchedState = onChange(state, (path, value) => {
    if (path === 'form.valid') {
      if (value) {
        input.classList.remove('is-invalid');
        errorField.classList.remove('text-danger');
        errorField.classList.add('text-success');
        elements.form.reset();
        elements.input.focus();
      } else {
        input.classList.add('is-invalid');
        errorField.classList.add('text-danger');
        errorField.classList.remove('text-success');
      }
    }
    if (path === 'form.message') {
      errorField.textContent = value;
    }
  });

  return watchedState;
};
