import onChange from 'on-change';

export default (elements, i18n, state) => {
  const {
    form,
    input,
    messageField,
    submit,
    feedsContainer,
    postContainer,
    modal,
  } = elements;

  const renderPost = (post) => {
    const { title, link, id } = post;
    const itemContainer = document.createElement('li');
    itemContainer.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');
    const postLink = document.createElement('a');
    postLink.href = link;
    if (state.UIstate.touched.has(id)) {
      postLink.classList.add('fw-normal', 'link-secondary');
    } else {
      postLink.classList.add('fw-bold');
    }
    postLink.dataset.id = id;
    postLink.target = '_blank';
    postLink.relList.add('noopener', 'noreferrer');
    postLink.textContent = title;
    const postButton = document.createElement('button');
    postButton.type = 'button';
    postButton.classList.add('btn', 'btn-outline-primary', 'btn-sm');
    postButton.dataset.id = id;
    postButton.dataset.bsToggle = 'modal';
    postButton.dataset.bsTarget = '#modal';
    postButton.textContent = i18n.t('interface.button');
    itemContainer.append(postLink, postButton);
    return itemContainer;
  };

  const renderPosts = (posts, container) => {
    const divContainer = document.createElement('div');
    divContainer.classList.add('card', 'border-0');
    const divHeader = document.createElement('div');
    divHeader.classList.add('card-body');
    const header = document.createElement('h2');
    header.classList.add('card-title', 'h4');
    header.textContent = i18n.t('interface.posts');
    divHeader.append(header);
    divContainer.append(divHeader);
    const postList = document.createElement('ul');
    postList.classList.add('list-group', 'border-0', 'rounded-0');
    posts.forEach((post) => postList.prepend(renderPost(post)));
    divContainer.append(postList);
    container.replaceChildren(divContainer);
  };

  const renderFeed = (feed) => {
    const { title, description } = feed;
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

  const renderFeeds = (feeds, container) => {
    const divContainer = document.createElement('div');
    divContainer.classList.add('card', 'border-0');
    const divHeader = document.createElement('div');
    divHeader.classList.add('card-body');
    const header = document.createElement('h2');
    header.classList.add('card-title', 'h4');
    header.textContent = i18n.t('interface.feeds');
    divHeader.append(header);
    divContainer.append(divHeader);
    const feedList = document.createElement('ul');
    feedList.classList.add('list-group', 'border-0', 'rounded-0');
    feeds.forEach((feed) => feedList.append(renderFeed(feed)));
    divContainer.append(feedList);
    container.replaceChildren(divContainer);
  };

  const renderModal = (post, container) => {
    const [{ title, description, link }] = post;
    const modalTitle = container.querySelector('h5');
    modalTitle.textContent = title;
    const modalDescription = container.querySelector('.modal-body');
    modalDescription.textContent = description;
    const modalLink = container.querySelector('a');
    modalLink.href = link;
  };

  const handleStatus = (value) => {
    switch (value) {
      case 'idle':
        messageField.textContent = '';
        break;
      case 'loading':
        input.disabled = true;
        submit.disabled = true;
        break;
      case 'done':
        input.disabled = false;
        form.reset();
        input.focus();
        submit.disabled = false;
        messageField.textContent = i18n.t('message.done');
        break;
      case 'error':
        input.disabled = false;
        submit.disabled = false;
        break;
      default:
        break;
    }
  };

  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'form.valid':
        input.classList.toggle('is-invalid', !value);
        break;
      case 'process.status':
        handleStatus(value);
        break;
      case 'process.isError':
        messageField.classList.toggle('text-success', !value);
        messageField.classList.toggle('text-danger', value);
        break;
      case 'process.message':
        messageField.textContent = i18n.t(`message.${value}`);
        break;
      case 'content.feeds':
        renderFeeds(value, feedsContainer);
        break;
      case 'content.posts':
        renderPosts(value, postContainer);
        break;
      case 'UIstate.touched':
        renderPosts(state.content.posts, postContainer);
        break;
      case 'UIstate.modalSelector':
        renderModal(state.content.posts.filter(({ id }) => id === value), modal);
        break;
      default:
        break;
    }
  });

  return watchedState;
};
