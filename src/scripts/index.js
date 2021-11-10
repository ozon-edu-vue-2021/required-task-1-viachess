"use strict";

const imageFetchButton = document.querySelector(".fetch");
const imageCardTemplate = document.querySelector("#image");
const popupImageTemplate = document.querySelector("#popup-image");
const container = document.querySelector(".images");

const popup = document.querySelector(".popup");
const popupContainer = document.querySelector(".popup .content");
const popupClose = document.querySelector(".popup .close-btn");
const loader = document.querySelector(".loader");

const MAX_PAGE_IMAGES = 34;
let loaderTimeout;

/**
 * Функция задаёт первоначальное состояние страницы.
 * Отправляется первый запрос за картинками, без параметров т.к. с дефолтными настройками.
 */
const initialState = function() {
  imageFetchButton.disabled = false;
  getPictures();
};

/**
 * Функция показывает индикатор загрузки.
 * Меняет ситили, ничего не возвращает.
 */
const showLoader = function() {
  loader.style.visibility = "visible";
};

/**
 * Функция скрывает индикатор загрузки.
 * Удаляет таймаут индикатора, ничего не возвращает.
 */
const hideLoader = function() {
  loaderTimeout = setTimeout(function() {
    loader.style.visibility = "hidden";
  }, 700);
};

/**
 * Функция запрашивает картинки для галереи
 * и вызывает ф-цию отрисовки полученных картинок
 * @param {number} page
 * @param {number} limit
 */
const getPictures = function(page = 1, limit = 10) {
  showLoader();
  fetch(`https://picsum.photos/v2/list?page=${page};limit=${limit}`)
    .then((res) => res.json())
    .then((res) => renderPictures(res));
};

/**
 * Функция запрашивает информацию о конкретной картинке по её id
 * и вызывает ф-цию для отрисовки картинки в попапе
 * @param { Number } id
 */
const getPictureInfo = function(id = 0) {
  showLoader();
  fetch(`https://picsum.photos/id/${id}/info`)
    .then(function(response) {
      return response.json();
    })
    .then(function(imageInfo) {
      renderPopupPicture(imageInfo);
    });
};

/**
 * Функция пропорционально делит размер картинки,
 * чтобы в превью не загружать слишком большие картинки,
 * которые возвращает сервис
 * @param { String } src
 * @param { Number } size: ;
 */
const cropImage = function(src, size = 2) {
  const [domain, key, id, width, height] = src.split("/").splice(2);
  const newWidth = Math.floor(+width / size);
  const newHeight = Math.floor(+height / size);

  return `https://${domain}/${key}/${id}/${newWidth}/${newHeight}`;
};

/**
 * Функция копирует шаблон для каждой картинки,
 * заполняет его и встраивает в разметку
 * @param { Array } list
 */
const renderPictures = function(list) {
  if (!list.length) {
    throw Error(`Pictures not defined. The list length: ${list.length}`);
  }

  const fragment = document.createDocumentFragment();
  list.forEach(function(element) {
    const imageTemplateContent = imageCardTemplate.cloneNode(true).content;
    const link = imageTemplateContent.querySelector("a");
    link.href = element.url;
    link.dataset.id = element.id;

    const image = imageTemplateContent.querySelector("img");
    image.src = cropImage(element.download_url, 5);
    image.alt = element.author;
    image.classList.add("preview");
    fragment.appendChild(imageTemplateContent);
  });

  container.appendChild(fragment);
  hideLoader();
};

/**
 * Функция переключает класс открытия на попапе
 */
const togglePopup = function() {
  popup.classList.toggle("open");
};

/**
 * Функция копирует шаблон для картинки в попапе,
 * заполняет его и встраивает в попап
 * @param {object} picture
 */
const renderPopupPicture = function(picture) {
  const popUpImageContent = popupImageTemplate.cloneNode(true).content;
  const img = popUpImageContent.querySelector("img");
  const link = popUpImageContent.querySelector(".link");
  const author = popUpImageContent.querySelector(".author");

  img.src = cropImage(picture.download_url, 2);
  img.alt = picture.author;
  author.textContent = picture.author;
  img.width = picture.width / 10;
  link.href = picture.download_url;

  popupContainer.innerHTML = "";
  const fragment = document.createDocumentFragment();
  fragment.appendChild(popUpImageContent);
  popupContainer.appendChild(fragment);
  hideLoader();
  togglePopup();
};

/**
 * Обработчик кнопки подгрузки картинок
 * @param {MouseEvent} evt
 */
const fetchImages = function(evt) {
  evt.preventDefault();
  const nextPage = evt.currentTarget.dataset.page;
  evt.currentTarget.dataset.page = parseInt(nextPage, 10) + 1;

  if (nextPage > MAX_PAGE_IMAGES) {
    console.warn(
      `WARN: You are trying to call a page that exceeds the maximum of ${MAX_PAGE_IMAGES} pages`
    );
    evt.currentTarget.disabled = true;
  } else {
    getPictures(nextPage);
  }
};

/**
 * Обработчик события click по картинкам.
 * Запрашивает данные по картинке, на которую кликнули,
 * для открытия попапа с ней
 * @param {MouseEvent} evt
 */
const imageHandler = function(evt) {
  evt.preventDefault();
  const closestLink = evt.target.closest("a");
  closestLink ? getPictureInfo(closestLink.dataset.id) : null;
};

imageFetchButton.addEventListener("click", fetchImages);
container.addEventListener("click", imageHandler);
popupClose.addEventListener("click", togglePopup);

initialState();
