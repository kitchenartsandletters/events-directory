class HeaderDetailsDisclosure extends DetailsDisclosure {
  #summaryLink;

  constructor() {
    super();

    this.#summaryLink = this.querySelector('summary > a');

    if (!this.mainDetailsToggle.hasAttribute('open'))
      this.#disableSummaryLink();

    this.mainDetailsToggle.addEventListener('mouseenter', () => {
      if (
        !document
          .querySelector('body')
          .hasAttribute('header-details-disclosure-edit')
      )
        this.open();
    });

    this.mainDetailsToggle.addEventListener('mouseleave', () => {
      if (
        !document
          .querySelector('body')
          .hasAttribute('header-details-disclosure-edit')
      )
        this.close();
    });
  }

  open() {
    this.mainDetailsToggle.setAttribute('open', '');
    this.querySelector('summary').setAttribute('aria-expanded', true);

    if (
      this.content.getBoundingClientRect().x + this.content.offsetWidth >
      window.innerWidth - 30
    ) {
      this.content.classList.add('is-left-aligned');
    }

    if (this.hasAttribute('adjust-mega-menu-height'))
      this.#setContentHeight(36);
  }

  close() {
    this.mainDetailsToggle.removeAttribute('open');
    this.mainDetailsToggle
      .querySelector('summary')
      .setAttribute('aria-expanded', false);

    this.content.classList.remove('is-left-aligned');

    if (this.hasAttribute('adjust-mega-menu-height'))
      this.#removeContentHeight();
  }

  onToggle() {
    if (!this.animations) this.animations = this.content.getAnimations();

    if (this.mainDetailsToggle.hasAttribute('open')) {
      this.#enableSummaryLink();
      // dropdown animation reset
      this.animations.forEach((animation) => animation.play());
      // mega items animation reset
      this.querySelectorAll('.has-animation').forEach((element) => {
        element.getAnimations().forEach((animation) => animation.play());
      });

      document.body.setAttribute('header-menu-open', '');
    } else {
      this.#disableSummaryLink();
      // dropdown animation cancel
      this.animations.forEach((animation) => animation.cancel());
      // mega items animation cancel
      this.querySelectorAll('.has-animation').forEach((element) => {
        element.getAnimations().forEach((animation) => animation.cancel());
      });

      document.body.removeAttribute('header-menu-open', '');
    }
  }

  #setContentHeight(padding = 0) {
    const headerSection = document.querySelector('.js-header');
    const headerBottomBoundary =
      headerSection && headerSection.getBoundingClientRect().bottom > 0
        ? headerSection.getBoundingClientRect().bottom
        : 0;
    const combinedPanelCutoff = Math.round(headerBottomBoundary + padding);

    if (this.content.offsetHeight > window.innerHeight - combinedPanelCutoff) {
      this.content.style.setProperty(
        '--header-elements-height',
        `${combinedPanelCutoff}px`,
      );
      this.content.classList.add('has-height-control');
    }
  }

  #removeContentHeight() {
    this.content.classList.remove('has-height-control');
  }

  #summaryLinkListener(e) {
    e.preventDefault();
  }

  #enableSummaryLink() {
    if (this.#summaryLink)
      this.#summaryLink.removeEventListener('click', this.#summaryLinkListener);
  }

  #disableSummaryLink() {
    if (this.#summaryLink)
      this.#summaryLink.addEventListener('click', this.#summaryLinkListener);
  }
}

customElements.define('header-details-disclosure', HeaderDetailsDisclosure);
