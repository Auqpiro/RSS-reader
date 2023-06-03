import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import resources from './locales/index.js';
import watch from './view.js';

let index = 0;

const uniqID = () => {
  index += 1;
  return index;
};

export default async () => {
  const elements = {
    form: document.querySelector('form'),
    input: document.querySelector('input'),
    messageField: document.querySelector('p.feedback'),
    feedsContainer: document.querySelector('div.feeds'),
    postContainer: document.querySelector('div.posts'),
  };

  const state = {
    form: {
      valid: null,
      links: [],
    },
    status: {
      resolve: null,
      message: null,
    },
    content: {
      feeds: [],
      posts: [],
    },
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

  const i18Instance = i18next.createInstance();
  i18Instance.init({
    lng: defaultLang,
    debug: false,
    resources,
  });

  const watchedState = watch(elements, i18Instance, state);

  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const newUrl = Object.fromEntries(formData);
    yup.object({
      url: yup.string().trim()
        .required()
        .url()
        .notOneOf(state.form.links),
    }).validate(newUrl)
      .then(({ url: feedURL }) => {
        watchedState.status.resolve = true;
        watchedState.status.message = 'loading';
        return feedURL;
      })
      .then((feedURL) => axios.get('/get', {
        baseURL: 'https://allorigins.hexlet.app/',
        params: {
          disableCache: true,
          url: feedURL,
        },
        transformResponse: [
          function parseResponse(data) {
            const response = JSON.parse(data);
            const parser = new DOMParser();
            const document = parser.parseFromString(response.contents, 'text/xml');
            return document;
          },
          function parseDocument(data) {
            const rssElement = data.querySelector('rss');
            if (!rssElement) {
              return new Promise((reject) => {
                reject();
              });
            }
            const feedTitle = data.querySelector('channel > title').textContent;
            const feedDescription = data.querySelector('channel > description').textContent;
            const feedLink = feedURL;
            const id = uniqID();
            const postsList = data.querySelectorAll('channel > item');
            const posts = [];
            postsList.forEach((item) => {
              const postTitle = item.querySelector('title').textContent;
              const postDescription = item.querySelector('description').textContent;
              const postLink = item.querySelector('link').textContent;
              const postID = uniqID();
              posts.push({
                title: postTitle,
                description: postDescription,
                link: postLink,
                feedID: id,
                id: postID,
              });
            });
            return [{
              title: feedTitle,
              description: feedDescription,
              link: feedLink,
              id,
            }, posts];
          },
        ],
      }))
      .then(({ data }) => {
        const [feed, posts] = data;
        watchedState.content.feeds.push(feed);
        watchedState.content.posts.push(...posts);
        watchedState.form.valid = true;
        watchedState.status.resolve = true;
        watchedState.status.message = 'done';
        state.form.links.push(feed.link);
        state.form.valid = null;
      })
      .catch((err) => {
        watchedState.status.resolve = false;
        if (err.message.key) {
          watchedState.form.valid = false;
          watchedState.status.message = err.message.key;
        } else if (err.message === 'Network Error') {
          watchedState.status.message = 'network';
        } else {
          watchedState.status.message = 'validRSS';
        }
      });
  });
};
