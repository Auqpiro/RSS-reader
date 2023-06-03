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

const parseDocument = (url, data) => {
  const rssElement = data.querySelector('rss');
  if (!rssElement) {
    return Promise.reject(new Error('validRSS'));
  }
  const feed = {
    title: data.querySelector('channel > title').textContent,
    description: data.querySelector('channel > description').textContent,
    link: url,
    id: uniqID(),
  };
  const posts = [];
  const postsList = data.querySelectorAll('channel > item');
  postsList.forEach((item) => {
    posts.push({
      title: item.querySelector('title').textContent,
      description: item.querySelector('description').textContent,
      link: item.querySelector('link').textContent,
      feedID: feed.id,
      id: uniqID(),
    });
  });
  return [feed, posts.reverse()];
};

const checkUniqPosts = (feedID, loadedPosts, oldPosts) => {
  const currentLinks = oldPosts.map(({ link }) => link);
  const uniqPosts = [];
  loadedPosts.forEach((post) => {
    const postLink = post.querySelector('link').textContent;
    if (!currentLinks.includes(postLink)) {
      uniqPosts.push({
        title: post.querySelector('title').textContent,
        description: post.querySelector('description').textContent,
        link: postLink,
        feedID,
        id: uniqID(),
      });
    }
  });
  return uniqPosts.reverse();
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

  const axInstance = axios.create({
    baseURL: 'https://allorigins.hexlet.app/get',
    transformResponse: [
      function parseResponse(data) {
        const response = JSON.parse(data);
        const parser = new DOMParser();
        const document = parser.parseFromString(response.contents, 'text/xml');
        return document;
      },
    ],
  });

  const watchedState = watch(elements, i18Instance, state);

  let refreshingTimeoutID;

  const checkFeeds = (currentState) => {
    const { links } = currentState.form;
    const { feeds, posts } = currentState.content;
    const timeoutID = setTimeout(() => {
      const promises = links.map((url) => axInstance({
        params: {
          disableCache: true,
          url,
        },
      }).then(({ data }) => [url, data]));
      Promise.all(promises)
        .then((contents) => {
          const newPosts = contents.flatMap(([url, data]) => {
            const [{ id }] = feeds.filter((feed) => feed.link === url);
            const oldPosts = posts.filter((post) => post.feedID === id);
            const loadedPosts = data.querySelectorAll('channel > item');
            return checkUniqPosts(id, loadedPosts, oldPosts);
          });
          watchedState.status.resolve = true;
          watchedState.status.message = 'done';
          watchedState.content.posts.push(...newPosts);
        })
        .catch(() => {
          watchedState.status.resolve = false;
          watchedState.status.message = 'network';
        })
        .finally(() => {
          refreshingTimeoutID = checkFeeds(currentState);
        });
    }, 5000);
    return timeoutID;
  };

  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearTimeout(refreshingTimeoutID);

    const formData = new FormData(event.target);
    const newUrl = Object.fromEntries(formData);

    yup.object({
      url: yup.string().trim()
        .required()
        .url()
        .notOneOf(state.form.links),
    }).validate(newUrl)
      .then(({ url }) => {
        watchedState.form.valid = true;
        watchedState.status.resolve = true;
        watchedState.status.message = 'loading';
        return url;
      })
      .then((url) => axInstance({
        params: {
          disableCache: true,
          url,
        },
      })
        .catch(() => Promise.reject(new Error('network'))))
      .then(({ data }) => parseDocument(newUrl.url, data))
      .then((data) => {
        const [feed, posts] = data;
        watchedState.form.valid = true;
        watchedState.status.resolve = true;
        watchedState.status.message = 'done';
        watchedState.content.feeds.push(feed);
        watchedState.content.posts.push(...posts);
        state.form.links.push(newUrl.url);
      })
      .catch((err) => {
        watchedState.status.resolve = false;
        watchedState.form.valid = false;
        if (err.message.key) {
          watchedState.status.message = err.message.key;
        } else {
          watchedState.status.message = err.message;
        }
      });

    refreshingTimeoutID = checkFeeds(state);
  });
};
