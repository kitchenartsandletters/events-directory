class TabbedContent extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.tabs = this.querySelectorAll('tab-triggers button');
    this.tabPanels = this.querySelectorAll('tab-panel');
    this.tabList = this.querySelector('tab-triggers');
    this.currentTab = Array.from(this.tabs).findIndex((el) => el.getAttribute('aria-selected') === 'true');

    this.tabs.forEach((tab) => {
      tab.addEventListener('click', (e) => this.openTab(e.target.id));
    });

    this.tabList.addEventListener('keydown', (e) => {
      // Move right
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        this.tabs[this.currentTab].setAttribute('tabindex', -1);
        if (e.key === 'ArrowRight') {
          this.currentTab++;

          if (this.currentTab >= this.tabs.length) {
            this.currentTab = 0;
          }
        } else if (e.key === 'ArrowLeft') {
          this.currentTab--;

          if (this.currentTab < 0) {
            this.currentTab = this.tabs.length - 1;
          }
        }

        this.tabs[this.currentTab].setAttribute('tabindex', 0);
        this.tabs[this.currentTab].focus();
      }
    });

    this.#revealItemsInPanel(this.querySelector(`#${this.tabs[this.currentTab].getAttribute('aria-controls')}`));
  }

  openTab(id) {
    const tab = Array.from(this.tabs).find((tab) => tab.id === id);

    this.tabList
      .querySelectorAll('[aria-selected="true"]')
      .forEach((t) => {
        t.setAttribute('aria-selected', false);
        t.setAttribute('tabindex', '-1');
      });

    tab.setAttribute('aria-selected', true);
    tab.setAttribute('tabindex', '0');

    Array.from(this.tabPanels).forEach((p) => {
      if (document.body.dataset.animLoad === 'true' && window.sr) {
        const cardsToReset = p.querySelectorAll('.product-card-top');

        // window.sr.clean(cardsToReset);
        Array.from(cardsToReset).forEach((card) => {
          card.classList.remove('js-sr-loaded');
          card.removeAttribute('style');
          card.removeAttribute('data-sr-id');
        });
      }

      p.setAttribute('hidden', true);
    });

    const newSelectedPanel = this.querySelector(`#${tab.getAttribute('aria-controls')}`);

    newSelectedPanel.removeAttribute('hidden');

    this.#revealItemsInPanel(newSelectedPanel);
  }

  #revealItemsInPanel(panel) {
    if (document.body.dataset.animLoad === 'true' && window.sr) {
      const cardsToAnimate = panel.querySelectorAll('.product-card-top');

      window.requestAnimationFrame(() => {
        cardsToAnimate.forEach((el) => {
          const container = el.closest('[data-items]');

          window.sr.reveal(el, {
            container,
            origin: 'bottom',
            delay: 16,
            reset: true
          });
        });
      });
    }
  }
}
customElements.define('tabbed-content', TabbedContent);

class TabTriggers extends HTMLElement {
  #triggersObserver;

  constructor() {
    super();

    this.#triggersObserver = null;

    this.alignItems = this.parentElement.getAttribute('align-items') || 'left';
  }

  connectedCallback() {
    const debounce = (f, delay) => {
      let timer = 0;
      return (...args) => {
          clearTimeout(timer);
          timer = setTimeout(() => f.apply(this, args), delay);
      };
    }

    this.#initTriggersObserver();
    this.#initLinkUpdate();

    const resizeObserver = new ResizeObserver(debounce(() => {
      this.#updateControls();
    }), 50);

    resizeObserver.observe(this);
  }

  #initTriggersObserver() {
    const callback = (mutationList) => {
      for (const mutation of mutationList) {
        if (mutation.type === 'attributes' &&
            mutation.attributeName === 'aria-selected' &&
            mutation.target.getAttribute('aria-selected', 'true')) {
          this.#moveToSelected();
        }
      }
    };

    this.#triggersObserver = new MutationObserver(callback);
  }

  #initLinkUpdate() {
    const triggers = this.querySelectorAll('button');
    const anchor = this.closest('.section').querySelector('.js-update-link');

    if (anchor) {
      Array.from(triggers).forEach((trigger) => {
        trigger.addEventListener('click', () => {
          const link = trigger.dataset.updateLink;

          if (link) {
            anchor.setAttribute('href', link);
          }
        });
      });
    }
  }

  #moveToSelected() {
    if (!['left', 'center'].includes(this.alignItems)) return;

    const selected = this.querySelector('[aria-selected="true"]');
    const paddingLeft = Number(window.getComputedStyle(this).paddingLeft.replace('px', ''));

    if (selected) {
      const newPosition =
        this.alignItems === 'left' ?
          selected.offsetLeft - paddingLeft :
          selected.offsetLeft - (this.offsetWidth - selected.offsetWidth) / 2;

      this.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
    }
  }

  #updateControls() {
    if (this.scrollWidth > this.offsetWidth) {
      const triggers = this.querySelectorAll('button');

      Array.from(triggers).forEach((trigger) => {
        this.#triggersObserver.observe(trigger, {
          attributes: true,
          childList: false,
          subtree: false
        });
      });

      this.#moveToSelected();
    } else {
      this.#triggersObserver.disconnect();
    }
  }
}
customElements.define('tab-triggers', TabTriggers);
