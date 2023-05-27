import * as yup from 'yup';
import i18next from 'i18next';
import resources from './locales/index.js';
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

  yup.setLocale({
    mixed: {
      required: () => ({ key: 'required' }),
      notOneOf: () => ({ key: 'notOneOf' }),
    },
    string: {
      url: () => ({ key: 'validUrl' }),
    },
  });

  const defaultLang = 'ru';

  const i18n = i18next.createInstance();
  i18n.init({
    lng: defaultLang,
    debug: false,
    resources,
  });

  const watchedState = watch(elements, i18n, state);

  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const newUrl = Object.fromEntries(formData);
    yup.object({
      url: yup.string().trim().required().url()
        .notOneOf(state.rssList),
    }).validate(newUrl)
      .then(({ url: rssUrl }) => {
        watchedState.form.valid = true;
        watchedState.rssList.push(rssUrl);
        watchedState.form.message = 'done';
      })
      .catch((err) => {
        watchedState.form.valid = false;
        watchedState.form.message = err.message.key;
      });
  });
};
