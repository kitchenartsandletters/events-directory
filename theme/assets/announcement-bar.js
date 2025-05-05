class AnnouncementBar extends HTMLElement {

  constructor() {
    super();

    const debounce = (f, delay) => {
      let timer = 0;
      return (...args) => {
          clearTimeout(timer);
          timer = setTimeout(() => f.apply(this, args), delay);
      };
    }

    this.id = this.getAttribute('id');
    this.isDismissable = this.hasAttribute('dismissable');

    this.wrapper = this.querySelector('.announcement__wrapper');
    this.interactions = true;

    this.carouselContainer = this.querySelector(".announcement__carousel-container");
    this.carouselWrapper = this.querySelector(".announcement__carousel-wrapper");
    this.carouselSlides = this.querySelectorAll(".announcement__carousel-slides");

    this.autoplay = this.hasAttribute('autoplay');
    this.autoplayDelay = Number(this.getAttribute('autoplay-delay') || '5000');
    this.sectionID = this.carouselContainer.dataset.sectionId;
    this.currentSlide = 0;
    this.autoplayInterval = null;
    this.intersectionObserver = new IntersectionObserver(this.handleIntersection.bind(this));
    this.resizeObserver = new ResizeObserver(debounce(() => {
      this.setMaxContainerWidth();
    }), 50);

    if (this.isDismissable) this.#setUpDismissable();
  }

  connectedCallback() {
    this.carouselSlides[this.currentSlide].dataset.active = true;

    if (this.autoplay) {
      this.startAutoplay();
      this.carouselContainer.addEventListener('mouseenter', () => this.stopAutoplay());
      this.carouselContainer.addEventListener('mouseleave', () => {
        if (this.hasAttribute('popup-open')) return;
        this.startAutoplay();
      });
    }

    this.observeSlides();
    this.observeSlidesText();
    this.setMaxContainerWidth();
    if (this.carouselSlides.length > 1) this.#createNavigation();
  }

  observeSlides() {
    this.carouselSlides.forEach(slide => {
      this.intersectionObserver.observe(slide);
    });
  }

  observeSlidesText() {
    Array.from(this.querySelectorAll('.announcement__text')).forEach(text => {
      this.resizeObserver.observe(text);
    });
  }

  handleScroll() {
    const slideWidth = this.carouselSlides[0].getBoundingClientRect().width;
    this.currentSlide = Math.round(this.carouselWrapper.scrollLeft / slideWidth);
    this.carouselSlides.forEach((slide, index) => {
      index === this.currentSlide ? slide.dataset.active = true : delete slide.dataset.active;
    });
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        this.carouselWrapper.addEventListener("scroll", () => this.handleScroll());
      } else {
        this.carouselWrapper.removeEventListener("scroll", () => this.handleScroll());
      }
    });
  }

  setMaxContainerWidth() {
    let maxWidth = 0;
    this.carouselSlides.forEach(element => {
      const text = element.querySelector(".announcement__text")
      const width = text.offsetWidth;
      if (width > maxWidth) {
        maxWidth = width;
      }
    });
    const containerPadding = 180;
    this.carouselContainer.style.maxWidth = maxWidth + containerPadding + 'px';
  }

  disconnectedCallback() {
    this.stopAutoplay();
    if (this.carouselPrevBtn) this.carouselPrevBtn.removeEventListener('click', () => this.showPrevSlide());
    if (this.carouselNextBtn) this.carouselNextBtn.removeEventListener('click', () => this.showNextSlide());
    this.carouselContainer.removeEventListener('mouseenter', () => this.stopAutoplay());
    this.carouselContainer.removeEventListener('mouseleave', () => this.startAutoplay());
    this.intersectionObserver.disconnect();
    this.resizeObserver.disconnect();
  }

  showPrevSlide() {
    this.currentSlide === 0 ? this.moveToSlide(this.carouselSlides.length - 1) : this.moveToSlide(this.currentSlide - 1);
  }

  showNextSlide() {
    this.currentSlide === this.carouselSlides.length - 1 ? this.moveToSlide(0) : this.moveToSlide(this.currentSlide + 1);
  }

  startAutoplay() {
    if (!this.interactions) return;

    if (this.autoplayInterval === null) {
      this.setAttribute('scrolling', '');
      this.autoplayInterval = setInterval(() => {
        this.showNextSlide();
      }, this.autoplayDelay);
    }
  }

  stopAutoplay() {
    if (!this.interactions) return;

    if (this.autoplayInterval !== null) {
      this.removeAttribute('scrolling');
      clearInterval(this.autoplayInterval);
      this.autoplayInterval = null;
    }
  }

  moveToSlide(slideIndex, behavior = 'smooth') {
    this.carouselWrapper.scrollTo({
      left: this.carouselSlides[slideIndex].offsetLeft,
      behavior
    });
    this.currentSlide = slideIndex;
    this.carouselSlides.forEach((slide, index) => {
      index === this.currentSlide ? slide.dataset.active = true : delete slide.dataset.active;
    });
  }

  moveToSlideById(slideId, behavior = 'smooth') {
    const slideToScrollTo = document.getElementById(slideId);

    if (!slideToScrollTo) return;

    const slideToScrollToIndex = [...this.carouselSlides].indexOf(slideToScrollTo);

    if (slideToScrollToIndex > -1) {
      this.moveToSlide(slideToScrollToIndex, behavior);
    }
  }

  dismiss() {
    sessionStorage.setItem(this.id, 0);
    this.setAttribute('hidden', 'hidden');
  }

  stopInteractions() {
    this.interactions = false;
  }

  resumeInteractions() {
    this.interactions = true;
  }

  #setUpDismissable() {
    this.closeBtn = document.createElement('button');
    this.closeBtn.classList.add('announcement__close');
    this.closeBtn.setAttribute('aria-label', 'Close');
    this.closeBtn.innerHTML = `<i class="icon icon--close" aria-hidden="true"></i>`;

    this.wrapper.prepend(this.closeBtn);

    this.closeBtn.addEventListener('click', this.dismiss.bind(this));
  }

  #createNavigation() {
    this.carouselPrevBtn = document.createElement('button');
    this.carouselPrevBtn.classList.add('announcement__carousel-button', 'carousel-prev');
    this.carouselPrevBtn.setAttribute('aria-label', 'Previous');
    this.carouselPrevBtn.innerHTML = `<i class="icon icon--left" aria-hidden="true"></i>`;
    this.carouselContainer.prepend(this.carouselPrevBtn);

    this.carouselNextBtn = document.createElement('button');
    this.carouselNextBtn.classList.add('announcement__carousel-button', 'carousel-next');
    this.carouselNextBtn.setAttribute('aria-label', 'Next');
    this.carouselNextBtn.innerHTML = `<i class="icon icon--right" aria-hidden="true"></i>`;
    this.carouselContainer.append(this.carouselNextBtn);

    this.carouselPrevBtn.addEventListener('click', () => this.showPrevSlide());
    this.carouselNextBtn.addEventListener('click', () => this.showNextSlide());
  }
}

customElements.define('announcement-bar', AnnouncementBar);