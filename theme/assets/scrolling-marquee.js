class ScrollingMarquee extends HTMLElement {
  constructor() {
    super();

    const debounce = (f, delay) => {
      let timer = 0;
      return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => f.apply(this, args), delay);
      };
    };

    this.marqueeContainer = this.querySelector('.marquee');
    this.marqueeWidth = this.marqueeContainer.offsetWidth;
    this.marqueeElements = [...this.querySelectorAll('.marquee__content')];
    this.marqueeSpeed = this.getAttribute('marquee-speed');
    this.speedModifier = 10;
    this.speed = this.marqueeSpeed * this.speedModifier;

    this.resizeObserver = new ResizeObserver(
      debounce(() => {
        this.setMarqueeSpeed();
      }),
      50,
    );
  }

  connectedCallback() {
    this.observeMarquee();
    this.setMarqueeSpeed();
  }

  observeMarquee() {
    this.resizeObserver.observe(this.marqueeContainer);
  }

  setMarqueeSpeed() {
    const marqueeComputedStyle = window.getComputedStyle(this.marqueeContainer);
    const gapValue = parseInt(
      marqueeComputedStyle.getPropertyValue('column-gap'),
      10,
    );
    const speed = this.speed;
    this.marqueeElements.forEach((element) => {
      const elementWidth = element.offsetWidth + gapValue;
      const timeTaken = elementWidth / speed;

      element.style.animationDuration = `${timeTaken}s`;
    });
  }
}

customElements.define('scrolling-marquee', ScrollingMarquee);
