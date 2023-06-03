import onChange from 'on-change';

const renderPost = (title, link, id) => {
  const itemContainer = document.createElement('li');
  itemContainer.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');
  const postLink = document.createElement('a');
  postLink.href = link;
  postLink.classList.add('fw-bold');
  postLink.dataset.id = id;
  postLink.target = '_blank';
  postLink.relList.add('noopener', 'noreferrer');
  postLink.textContent = title;
  itemContainer.append(postLink);
  return itemContainer;
};

const renderPosts = (posts) => {
  const divContainer = document.createElement('div');
  divContainer.classList.add('card', 'border-0');
  const divHeader = document.createElement('div');
  divHeader.classList.add('card-body');
  const header = document.createElement('h2');
  header.classList.add('card-title', 'h4');
  header.textContent = 'Посты';
  divHeader.append(header);
  divContainer.append(divHeader);
  const postList = document.createElement('ul');
  postList.classList.add('list-group', 'border-0', 'rounded-0');
  posts.forEach(({ title, link, id }) => {
    const itemContainer = renderPost(title, link, id);
    postList.prepend(itemContainer);
  });
  divContainer.append(postList);
  return divContainer;
};

const renderFeed = (title, description) => {
  const itemContainer = document.createElement('li');
  itemContainer.classList.add('list-group-item', 'border-0', 'border-end-0');
  const feedTitle = document.createElement('h3');
  feedTitle.classList.add('h6', 'm-0');
  feedTitle.textContent = title;
  const feedDescription = document.createElement('p');
  feedDescription.classList.add('m-0', 'small', 'text-black-50');
  feedDescription.textContent = description;
  itemContainer.append(feedTitle, feedDescription);
  return itemContainer;
};

const renderFeeds = (feeds) => {
  const divContainer = document.createElement('div');
  divContainer.classList.add('card', 'border-0');
  const divHeader = document.createElement('div');
  divHeader.classList.add('card-body');
  const header = document.createElement('h2');
  header.classList.add('card-title', 'h4');
  header.textContent = 'Фиды';
  divHeader.append(header);
  divContainer.append(divHeader);
  const feedList = document.createElement('ul');
  feedList.classList.add('list-group', 'border-0', 'rounded-0');
  feeds.forEach(({ title, description }) => {
    const itemContainer = renderFeed(title, description);
    feedList.append(itemContainer);
  });
  divContainer.append(feedList);
  return divContainer;
};

export default (elements, i18n, state) => {
  const {
    form,
    input,
    messageField,
    feedsContainer,
    postContainer,
  } = elements;

  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'form.valid':
        input.classList.toggle('is-invalid', !value);
        break;
      case 'status.resolve':
        messageField.classList.toggle('text-success', value);
        messageField.classList.toggle('text-danger', !value);
        break;
      case 'status.message':
        messageField.textContent = i18n.t(`message.${value}`);
        break;
      case 'content.feeds':
        form.reset();
        input.focus();
        feedsContainer.replaceChildren(renderFeeds(value));
        break;
      case 'content.posts':
        postContainer.replaceChildren(renderPosts(value));
        break;
      default:
        break;
    }
  });

  return watchedState;
};
