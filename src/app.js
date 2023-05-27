import * as yup from 'yup';
import watch from './view.js';

export default async () => {
  const elements = {
    form: document.querySelector('form'),
    input: document.querySelector('input'),
    errorField: document.querySelector('p.feedback '),
  };

  const state = {
    form: {
      valid: null,
      message: null,
    },
    rssList: [],
  };

  const watchedState = watch(elements, state);

  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const newUrl = Object.fromEntries(formData);
    yup.object({
      url: yup
        .string()
        .trim()
        .required('Не должно быть пустым')
        .url('Ссылка должна быть валидным URL')
        .notOneOf(state.rssList, 'RSS уже существует'),
    }).validate(newUrl)
      .then(({ url: rssUrl }) => {
        watchedState.form.valid = true;
        watchedState.rssList.push(rssUrl);
        watchedState.form.message = 'RSS успешно загружен';
      })
      .catch((err) => {
        watchedState.form.valid = false;
        watchedState.form.message = err.message;
      });
  });
};
