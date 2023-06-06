import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import * as bootstrap from 'bootstrap';
import _ from 'lodash';
import resources from './locales/index.js';
import watch from './view.js';
import parseDocument from './utils/parser.js';

const getRequests = (url) => axios.get('https://allorigins.hexlet.app/get', {
  params: {
    disableCache: true,
    url,
  },
});

const getErrorMessage = (error) => {
  if (error.isParseError) {
    console.error(error.data);
    return 'validRSS';
  }
  if (error.code === 'ERR_NETWORK') {
    return 'network';
  }
  return error.message;
};

const validateURL = (url, validaded) => {
  const schema = yup.string().trim()
    .required()
    .url()
    .notOneOf(validaded);
  return schema.validate(url);
};

const updateAllRSS = (currentState) => {
  if (currentState.form.links.length === 0) {
    setTimeout(() => updateAllRSS(currentState), 5000);
    return;
  }
  const promises = currentState.content.feeds.map(({ id, link }) => getRequests(link)
    .then((response) => {
      const { posts } = parseDocument(response.data.contents);
      const oldPosts = currentState.content.posts;
      const newPosts = _.differenceBy(posts, oldPosts, 'title')
        .map((post) => ({ ...post, feedID: id, id: _.uniqueId() }));
      return newPosts;
    }));
  Promise.all(promises)
    .then((contents) => {
      const newPosts = contents.flat();
      if (newPosts.length !== 0) {
        currentState.content.posts.push(...newPosts);
      }
    })
    .catch((error) => console.error(error))
    .finally(() => {
      setTimeout(() => updateAllRSS(currentState), 5000);
    });
};

const app = (i18Instance) => {
  const elements = {
    form: document.querySelector('form'),
    input: document.querySelector('input'),
    submit: document.querySelector('button[type="submit"]'),
    messageField: document.querySelector('p.feedback'),
    feedsContainer: document.querySelector('div.feeds'),
    postContainer: document.querySelector('div.posts'),
    modal: document.getElementById('modal'),
  };

  const state = {
    form: {
      // idle, loading, done, error
      status: 'idle',
      valid: null,
      links: [],
    },
    feedback: {
      isError: null,
      message: null,
    },
    content: {
      feeds: [],
      posts: [],
      touched: new Set(),
    },
    modal: {
      touchedID: null,
    },
  };

  const watchedState = watch(elements, i18Instance, state);

  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const newUrl = formData.get('url');
    watchedState.form.status = 'idle';
    validateURL(newUrl, watchedState.form.links)
      .catch((error) => {
        watchedState.form.valid = false;
        throw error;
      })
      .then((url) => {
        watchedState.form.valid = true;
        watchedState.form.status = 'loading';
        return getRequests(url);
      })
      .then((response) => {
        const { contents } = response.data;
        const { feed, posts } = parseDocument(contents);
        feed.id = _.uniqueId();
        feed.link = newUrl;
        watchedState.content.feeds.push(feed);
        const idBindedPosts = posts.map((post) => ({ ...post, feedID: feed.id, id: _.uniqueId() }));
        watchedState.content.posts.push(...idBindedPosts);
        watchedState.form.links.push(newUrl);
        watchedState.form.status = 'done';
        watchedState.feedback.isError = false;
        watchedState.feedback.message = 'done';
      })
      .catch((error) => {
        watchedState.form.status = 'error';
        watchedState.feedback.isError = true;
        watchedState.feedback.message = getErrorMessage(error);
      });
  });

  const myModal = new bootstrap.Modal(elements.modal);

  elements.postContainer.addEventListener('click', ({ target }) => {
    const touchedPostID = target.dataset.id;
    if (touchedPostID) {
      watchedState.content.touched.add(touchedPostID);
      if (target.tagName === 'BUTTON') {
        watchedState.modal.touchedID = touchedPostID;
        myModal.show();
      }
    }
  });

  setTimeout(() => updateAllRSS(watchedState), 5000);
};

export default async () => {
  const defaultLang = 'ru';
  const i18Instance = i18next.createInstance();
  i18Instance.init({
    lng: defaultLang,
    debug: false,
    resources,
  })
    .then(() => {
      yup.setLocale({
        mixed: {
          required: () => ('required'),
          notOneOf: () => ('notOneOf'),
        },
        string: {
          url: () => ('validUrl'),
        },
      });
      app(i18Instance);
    });
};
