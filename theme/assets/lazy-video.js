class LazyVideo extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    var lazyVideoObserver = new IntersectionObserver(function (
      entries,
      observer,
    ) {
      entries.forEach(function (video) {
        if (video.isIntersecting) {
          for (var source in video.target.querySelectorAll('source')) {
            var videoSource = video.target.querySelectorAll('source')[source];
            if (
              typeof videoSource.tagName === 'string' &&
              videoSource.tagName === 'SOURCE'
            ) {
              videoSource.src = videoSource.dataset.src;
            }
          }

          video.target.querySelector('video').load();
          lazyVideoObserver.unobserve(video.target);
        }
      });
    });

    lazyVideoObserver.observe(this);
  }
}

customElements.define('lazy-video', LazyVideo);
