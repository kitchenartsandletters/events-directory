/*jshint -W087 */
/*jshint sub:true*/
/*jshint loopfunc:true */

// CustomEvent polyfill
(function() {
  if (typeof window.CustomEvent === "function") return false; //If not IE

  function CustomEvent(event, params) {
  params = params || { bubbles: false, cancelable: false, detail: undefined };
  var evt = document.createEvent("CustomEvent");
  evt.initCustomEvent(
    event,
    params.bubbles,
    params.cancelable,
    params.detail
  );
  return evt;
  }

  CustomEvent.prototype = window.Event.prototype;

  window.CustomEvent = CustomEvent;
})();
// ReplaceAll polyfill
if (!String.prototype.replaceAll) {
  String.prototype.replaceAll = function(str, newStr){
    if (Object.prototype.toString.call(str).toLowerCase() === '[object regexp]') {
      return this.replace(str, newStr);
    }
    return this.replace(new RegExp(str, 'g'), newStr);
  };
}
// RequestSubmit polyfill
(function(prototype) {
  if (typeof prototype.requestSubmit == "function") return;

  prototype.requestSubmit = function(submitter) {
    if (submitter) {
      validateSubmitter(submitter, this);
      submitter.click();
    } else {
      submitter = document.createElement("input");
      submitter.type = "submit";
      submitter.hidden = true;
      this.appendChild(submitter);
      submitter.click();
      this.removeChild(submitter);
    }
  };

  function validateSubmitter(submitter, form) {
    if (!(submitter instanceof HTMLElement)) raise(TypeError, "parameter 1 is not of type 'HTMLElement'");
    if (submitter.type == "submit") raise(TypeError, "The specified element is not a submit button");
    if (submitter.form == form) raise(DOMException, "The specified element is not owned by this form element", "NotFoundError");
  }

  function raise(errorConstructor, message, name) {
    throw new errorConstructor("Failed to execute 'requestSubmit' on 'HTMLFormElement': " + message + ".", name);
  }
})(HTMLFormElement.prototype);

// Get size of an image that uses object fit contain property. Useful for ratio elements
function getObjectFitSize(contains /* true = contain, false = cover */, containerWidth, containerHeight, width, height){
    var doRatio = width / height;
    var cRatio = containerWidth / containerHeight;
    var targetWidth = 0;
    var targetHeight = 0;
    var test = contains ? (doRatio > cRatio) : (doRatio < cRatio);

    if (test) {
        targetWidth = containerWidth;
        targetHeight = targetWidth / doRatio;
    } else {
        targetHeight = containerHeight;
        targetWidth = targetHeight * doRatio;
    }

    return {
        width: targetWidth,
        height: targetHeight,
        x: (containerWidth - targetWidth) / 2,
        y: (containerHeight - targetHeight) / 2
    };
}

function getFocusableElements(container) {
  return Array.from(
    container.querySelectorAll(
      "summary, a[href], button:enabled, [tabindex]:not([tabindex^='-']), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe",
    ),
  );
}

// Trap focus inside an element
const trapFocusHandlers = {};

function trapFocus(container, elementToFocus = container) {
  var elements = getFocusableElements(container);
  var first = elements[0];
  var last = elements[elements.length - 1];

  removeTrapFocus();

  trapFocusHandlers.focusin = (event) => {
    if (
      event.target !== container &&
      event.target !== last &&
      event.target !== first
    )
      return;

    document.addEventListener('keydown', trapFocusHandlers.keydown);
  };

  trapFocusHandlers.focusout = function () {
    document.removeEventListener('keydown', trapFocusHandlers.keydown);
  };

  trapFocusHandlers.keydown = function (event) {
    if (event.code.toUpperCase() !== 'TAB') return; // If not TAB key
    // On the last focusable element and tab forward, focus the first element.
    if (event.target === last && !event.shiftKey) {
      event.preventDefault();
      first.focus();
    }

    //  On the first focusable element and tab backward, focus the last element.
    if (
      (event.target === container || event.target === first) &&
      event.shiftKey
    ) {
      event.preventDefault();
      last.focus();
    }
  };

  document.addEventListener('focusout', trapFocusHandlers.focusout);
  document.addEventListener('focusin', trapFocusHandlers.focusin);

  elementToFocus.focus();
}

function removeTrapFocus(elementToFocus = null) {
  document.removeEventListener('focusin', trapFocusHandlers.focusin);
  document.removeEventListener('focusout', trapFocusHandlers.focusout);
  document.removeEventListener('keydown', trapFocusHandlers.keydown);

  if (elementToFocus) elementToFocus.focus();
}


//jQuery 'passive listeners to improve scrolling performance' fix
jQuery.event.special.touchstart = {
  setup: function( _, ns, handle ) {
    this.addEventListener("touchstart", handle, { passive: !ns.includes("noPreventDefault") });
  }
};
jQuery.event.special.touchmove = {
  setup: function( _, ns, handle ) {
    this.addEventListener("touchmove", handle, { passive: !ns.includes("noPreventDefault") });
  }
};
jQuery.event.special.wheel = {
  setup: function( _, ns, handle ){
    this.addEventListener("wheel", handle, { passive: true });
  }
};
jQuery.event.special.mousewheel = {
  setup: function( _, ns, handle ){
    this.addEventListener("mousewheel", handle, { passive: true });
  }
};

if (typeof theme === "undefined") {
  theme = {};
}
var html = $("html");
var body = $("body");
var winWidth = $(window).width();
var winHeight = $(window).height();
theme.mobileBrkp = 768;
theme.tabletBrkp = 981;

// Callback is a function which takes HTMLElement as parameter
// Threshold is an optional parameter – array of values between 0 and 1
function generateFireOnViewObserver (callback, threshold) {
  if (typeof threshold === undefined) threshold = [0.1];

  return !!window.IntersectionObserver ? new IntersectionObserver(
    function (elements, observer) {
      elements.forEach(function(element) {
        if (!element.isIntersecting) return;

        callback(element.target);
        observer.unobserve(element.target);
      });
    },
    {threshold: threshold}
  ) : null;
}

theme.LibraryLoader = (function() {
  var types = {
    link: 'link',
    script: 'script'
  };

  var status = {
    requested: 'requested',
    loaded: 'loaded'
  };

  var cloudCdn = 'https://cdn.shopify.com/shopifycloud/';

  var libraries = {
    youtubeSdk: {
      tagId: 'youtube-sdk',
      src: 'https://www.youtube.com/iframe_api',
      type: types.script
    },
    plyr: {
      tagId: 'plyr',
      src: theme.assets.plyr,
      type: types.script
    },
    plyrShopify: {
      tagId: 'plyr-shopify',
      src: cloudCdn + 'shopify-plyr/v1.0/shopify-plyr-legacy.en.js',
      type: types.script
    },
    plyrShopifyStyles: {
      tagId: 'plyr-shopify-styles',
      src: cloudCdn + 'shopify-plyr/v1.0/shopify-plyr.css',
      type: types.link
    },
    shopifyXr: {
      tagId: 'shopify-model-viewer-xr',
      src: cloudCdn + 'shopify-xr-js/assets/v1.0/shopify-xr.en.js',
      type: types.script
    },
    modelViewerUi: {
      tagId: 'shopify-model-viewer-ui',
      src: cloudCdn + 'model-viewer-ui/assets/v1.0/model-viewer-ui.en.js',
      type: types.script
    },
    modelViewerUiStyles: {
      tagId: 'shopify-model-viewer-ui-styles',
      src: cloudCdn + 'model-viewer-ui/assets/v1.0/model-viewer-ui.css',
      type: types.link
    },
    masonry: {
      tagId: 'masonry',
      src: theme.assets.masonry,
      type: types.script
    },
  photoswipe: {
      tagId: 'photoswipe',
      src: theme.assets.photoswipe,
      type: types.script
    },
  fecha: {
      tagId: 'fecha',
      src: theme.assets.fecha,
      type: types.script
    },
  gmaps: {
    tagId: 'gmaps',
    src: 'https://maps.googleapis.com/maps/api/js?key=' + theme.map.key || '',
    type: types.script
  },
  gmapsSettings: {
    tagId: 'gmapsSettings',
    src: theme.map_settings_url,
    type: types.script
  }
  };

  function load(libraryName, callback, key) {
    var library = libraries[libraryName];

    if (!library) return;
    if (library.status === status.requested) return;

    callback = callback || function() {};
    if (library.status === status.loaded) {
      callback();
      return;
    }

    library.status = status.requested;

    var tag;

    switch (library.type) {
      case types.script:
        tag = createScriptTag(library, callback);
        break;
      case types.link:
        tag = createLinkTag(library, callback);
        break;
    }

    tag.id = library.tagId;
    library.element = tag;

    var firstScriptTag = document.getElementsByTagName(library.type)[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  }

  function createScriptTag(library, callback) {
    var tag = document.createElement('script');
    tag.src = library.src;
    tag.addEventListener('load', function() {
      library.status = status.loaded;
      callback();
    });
    return tag;
  }

  function createLinkTag(library, callback) {
    var tag = document.createElement('link');
    tag.href = library.src;
    tag.rel = 'stylesheet';
    tag.type = 'text/css';
    tag.addEventListener('load', function() {
      library.status = status.loaded;
      callback();
    });
    return tag;
  }

  return {
    load: load
  };
})();

// ==========
// Maps logic
// ==========
theme.runMap = function(mapElementId) {
  var thisMap = $("#" + mapElementId);

  var thisMapId = thisMap.data("map-id");
  var thisMapSection = thisMap.data("map-section");
  var thisMapAddress = thisMap.data("map-address");
  var thisMapStyle = thisMap.data("map-style");
  var thisMapPin = thisMap.data("map-pin");

  function mapInit(mapId, mapSection, mapAddress, mapStyle, mapPin) {
    var geocoder;
    var map;

    geocoder = new google.maps.Geocoder();
    var latlng = new google.maps.LatLng(1, 1);
    var myOptions = {
      zoom: 14,
      zoomControl: true,
      center: latlng,
      disableDefaultUI: true,
      scrollwheel: false,
      keyboardShortcuts: false,
      styles: window.mapStyles[mapStyle]
    };
    map = new google.maps.Map(document.getElementById(mapId), myOptions);

    if (geocoder) {
      geocoder.geocode({ address: mapAddress }, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          if (status != google.maps.GeocoderStatus.ZERO_RESULTS) {
            map.setCenter(results[0].geometry.location);

            var marker = new google.maps.Marker({
              position: results[0].geometry.location,
              map: map,
              icon: window[mapPin]
            });
          }
        }
      });
    }
  }

  mapInit(thisMapId, thisMapSection, thisMapAddress, thisMapStyle, thisMapPin);
};

theme.homeMapsInitiate = function(mapContainerElement) {
  // if (!window.mapStyles) window.mapStyles = {};

  $(mapContainerElement).find(".js-map-info").hide(); //hide all items

  //show and activate first item in each map
  $(mapContainerElement)
    .find(".js-map-info")
    .first()
    .addClass("js-active")
    .show();
  $(mapContainerElement)
    .find(".js-map-trigger")
    .first()
    .addClass("js-active");

  function eachMapInit(mapContainer) {
    //move maps inside tab on mobile
    $(mapContainer).find(".js-map-replace").appendAround();

    $(mapContainer).find(".js-map-ids").each(function() {
      var thisMapId = $(this).data("map-id");

      theme.runMap(thisMapId);
    });
  }

  function triggerMapsInitiate(mapsContainer) {
    if (theme.map.key) {
      theme.LibraryLoader.load('gmaps', function() {
        theme.LibraryLoader.load('gmapsSettings', function() {
          eachMapInit(mapsContainer);
        });
      });
    } else {
      eachMapInit(mapsContainer);
    }
  }

  triggerMapsInitiate(mapContainerElement);
};

theme.homeMaps = function() {
  function mapTrigger() {
    $(document).on('click', '.js-map-trigger', function() {
      var thisItemId = $(this).attr("href");
      var $thisItem = $(thisItemId);
      var $theseItems = $thisItem
        .parents(".js-map")
        .find(".js-map-info");

      var trigger = $(".js-map-trigger");
      var activeClass = "js-active";

      //check if info is not active
      if (!$thisItem.hasClass(activeClass)) {
        $theseItems.removeClass(activeClass).slideUp();
        $thisItem
          .addClass(activeClass)
          .slideDown();
      }

      //map canvas functions
      $(this)
        .parents(".js-map")
        .find(".js-map-media")
        .removeClass(activeClass); //hide all within section
      $('.js-map-media[data-map-id="' + thisItemId + '"]').addClass(activeClass); //show active

      //run current map function if it's hidden within tab
      if ($thisItem.find(".home-map__media-canvas").length) {
        var thisMapId = $thisItem
          .find(".home-map__media-canvas")
          .attr("id");

        if (typeof thisMapId != "undefined") {
          theme.runMap(thisMapId);
        }
      }

      //check if info is not active
      if (!$(this).hasClass(activeClass)) {
        trigger.removeClass(activeClass);
        $(this).addClass(activeClass);
      }

      return false;
    });
  }

  mapTrigger();

  var homeMapsObserver = generateFireOnViewObserver(theme.homeMapsInitiate);

  var $mapsContainers = $('.js-map');

  if ($mapsContainers.length > 0) {
    if (homeMapsObserver) {
      $mapsContainers.each(function() {
        homeMapsObserver.observe(this);
      });
    } else {
      theme.LibraryLoader.load('gmaps', function() {
        theme.LibraryLoader.load('gmapsSettings', function() {
          $mapsContainers.each(function() {
            theme.homeMapsInitiate(this);
          });
        });
      });
    }
  }
};

// ===================
// Layout slider logic
// ===================
theme.layoutSliderUpdate = function(sliderElement) {
  var thisSlider = $(sliderElement);

  function addClassToSlide() {
    thisSlider
      .find(".slick-current")
      .addClass("js-slide-seen");
  }

  //get sizes
  winWidth = $(window).width();

  if (winWidth < theme.mobileBrkp) {
    thisSlider.removeClass('layout-slider--loading');

    thisSlider.not(".slick-initialized").slick({
      slidesToShow: 1,
      infinite: false,
      dots: true,
      arrows: false,
      centerMode: true,
      centerPadding: "30px"
    });
    thisSlider.on("afterChange", addClassToSlide);
  } else {
    //check if slick is initiated
    if (thisSlider.hasClass("slick-initialized")) {
      //detach slick
      thisSlider.slick("unslick");
      thisSlider.off("afterChange", addClassToSlide);
    }
  }
};

theme.layoutSliderInit = function(sliderElement) {
  function updateOnResize() {
    theme.layoutSliderUpdate(sliderElement);
  }

  theme.layoutSliderUpdate(sliderElement);

  $(window).on('resize', updateOnResize);
};


theme.layoutSlider = function(sliderClass) {
  if (!sliderClass) return;

  var $sliderElements = $(sliderClass);

  var layoutSliderObserver = generateFireOnViewObserver(theme.layoutSliderInit);

  $sliderElements.each(function() {
    if (layoutSliderObserver && !Shopify.designMode) {
      layoutSliderObserver.observe(this);
    } else {
      theme.layoutSliderInit(this);
    }
  });
};

class ProductCardSwatches extends HTMLElement {
  constructor() {
    super();
    this.product = this.closest('.js-product');
    this.productLink = this.product.querySelector('.js-product-link');
    this.image = this.product.querySelector('.js-img-grid');
    this.hoverImage = this.product.querySelector('.js-img-grid-hover');

    this.triggers = this.querySelectorAll('.js-product-swatch-item');
    this.triggers.forEach((el) => el.addEventListener('click', (e) => {
      this.updateCardImage(e.target);
      this.updateQuickShopVariant(e.target);
    }));
  }

  updateCardImage(swatch) {
    const createSrcsetString = (srcSetWidths, url, originalWidth, originalHeight) => {
      if (!srcSetWidths || !url || !originalWidth || !originalHeight) return;

      const aspectRatio = parseInt(originalHeight, 10) / parseInt(originalWidth, 10);

      return srcSetWidths.reduce(function(srcSetString, srcSetWidth) {
        const sizeHeight = Math.floor(srcSetWidth * aspectRatio);
        srcSetString = srcSetString + url.replace('{width}', srcSetWidth) + ' ' + srcSetWidth + 'w ' + sizeHeight + 'h,';

        return srcSetString;
      }, '');
    };

    const variantProductImage = swatch.dataset.variantImage;
    const variantProductImageWidth = swatch.dataset.variantImageWidth;
    const variantProductImageHeight = swatch.dataset.variantImageHeight;
    const variantUrl = swatch.dataset.variantUrl;

    const newSrc = variantProductImage.replace('{width}', '300');
    const newSrcset = createSrcsetString([180, 360, 540, 720, 900, 1080, 1296, 1512], variantProductImage, variantProductImageWidth, variantProductImageHeight);

    //replace product image
    this.image.setAttribute('src', newSrc);
    this.image.setAttribute('width', '300');
    this.image.setAttribute('height', Math.floor(300 * (parseInt(variantProductImageHeight, 10) / parseInt(variantProductImageWidth, 10))));
    this.image.setAttribute('srcset', newSrcset);

    //replace product variant link
    this.productLink.setAttribute('href', variantUrl);

    //set swatch to active
    const activeSwatch = this.product.querySelector('.js-active');
    if (activeSwatch) activeSwatch.classList.remove('js-active');

    swatch.classList.add('js-active');

    if(this.hoverImage){
      const imageSrc = this.image.src;
      const hoverSrc = this.hoverImage.src;

      const hoverEnabledClass = 'hover-enabled';
      const hoverDisabledClass = 'hover-disabled';

      if(imageSrc === hoverSrc){
        this.image.classList.remove(hoverEnabledClass);
        this.hoverImage.classList.remove(hoverEnabledClass);

        this.image.classList.add(hoverDisabledClass);
        this.hoverImage.classList.add(hoverDisabledClass);
      } else {
        this.image.classList.remove(hoverDisabledClass);
        this.hoverImage.classList.remove(hoverDisabledClass);

        this.image.classList.add(hoverEnabledClass);
        this.hoverImage.classList.add(hoverEnabledClass);
      }
    }

    return false;
  }

  updateQuickShopVariant(swatch) {
    const variantId = swatch.dataset.variantId;
    const productInteractiveOptions = this.product.querySelector('product-interactive-options');

    if (variantId && productInteractiveOptions) {
      const id = Number(variantId);
      productInteractiveOptions.selectVariantById(id);
    }
  }
}
customElements.define('product-card-swatches', ProductCardSwatches);

// ============================================
// Product Grid - Image loading / spinner logic
// ============================================
class ProductCardSpinner extends HTMLElement {
  constructor() {
    super();

    this.init();
  }

  init() {
    const loadingClass = 'loading';
    const image = this.parentElement.querySelector('img');

    if (!image || image.tagName !== 'IMG') return;

    const callback = (mutationList) => {
      mutationList.forEach((mutation) => {
        if(mutation.type == 'attributes'){
          if(mutation.attributeName == 'src'){

            const oldUrlStr = mutation.oldValue.split('//cdn.shopify.com/').pop();
            const newUrlStr = mutation.target.src.split('//cdn.shopify.com/').pop();

            if(oldUrlStr !== newUrlStr) {

              const currImage = mutation.target;
              // const currSpinner = currImage.closest(".product-card__media").querySelector('.js-product-card__spinner');

              if (!currImage.classList.contains(loadingClass)) {
                currImage.classList.add(loadingClass);
                this.classList.add(loadingClass);
              }

              currImage.onload = () => {
                currImage.classList.remove(loadingClass);
                this.classList.remove(loadingClass);
              };
            }
          }
        }
      });
    };

    const observer = new MutationObserver(callback);

    observer.observe(image, {
      attributeFilter: [ "src" ],
      attributeOldValue: true,
      subtree: false
    });
  }
}
customElements.define('product-card-spinner', ProductCardSpinner);

// Youtube API callback
// eslint-disable-next-line no-unused-vars
function onYouTubeIframeAPIReady() {
  theme.ProductVideo.loadVideos(theme.ProductVideo.hosts.youtube);
}

theme.ProductVideo = (function() {
  var productCarousel = $('.js-product-slider');

  var videos = {};

  var hosts = {
    html5: 'html5',
    youtube: 'youtube'
  };

  var selectors = {
    productMediaWrapper: '[data-product-media-wrapper]'
  };

  var attributes = {
    enableVideoLooping: 'enable-video-looping',
    videoId: 'video-id'
  };

  function init(videoContainer, sectionId) {
    if (!videoContainer.length) {
      return;
    }

    var videoElement = videoContainer.find('iframe, video')[0];
    var mediaId = videoContainer.data('mediaId');

    if (!videoElement) {
      return;
    }

    videos[mediaId] = {
      mediaId: mediaId,
      sectionId: sectionId,
      host: hostFromVideoElement(videoElement),
      container: videoContainer,
      element: videoElement,
      ready: function() {
        createPlayer(this);
      }
    };

    var video = videos[mediaId];

    switch (video.host) {
      case hosts.html5:
        theme.LibraryLoader.load(
          'plyrShopify',
          loadVideos.bind(this, hosts.html5)
        );
        theme.LibraryLoader.load('plyrShopifyStyles');
        break;
      case hosts.youtube:
        theme.LibraryLoader.load('youtubeSdk');
        break;
    }
  }

  function createPlayer(video) {
    if (video.player) {
      return;
    }

    var productMediaWrapper = video.container.closest(
      selectors.productMediaWrapper
    );
    var enableLooping = productMediaWrapper.data(attributes.enableVideoLooping);

    switch (video.host) {
      case hosts.html5:
        // eslint-disable-next-line no-undef
        video.player = new Shopify.Plyr(video.element, {
          controls: [
            'play',
            'progress',
            'mute',
            'volume',
            'play-large',
            'fullscreen'
          ],
          youtube:	{ noCookie: false },
          loop: { active: enableLooping },
          hideControlsOnPause: true,
          iconUrl:
            '//cdn.shopify.com/shopifycloud/shopify-plyr/v1.0/shopify-plyr.svg',
          tooltips: { controls: false, seek: true }
        });
        break;
      case hosts.youtube:
        var videoId = productMediaWrapper.data(attributes.videoId);

        video.player = new YT.Player(video.element, {
          videoId: videoId,
          events: {
            onStateChange: function(event) {
              if (event.data === 0 && enableLooping) event.target.seekTo(0);
            }
          }
        });
        break;
    }

    //on media reveal
     productCarousel.on('beforeChange', function(event, slick, currentSlide, nextSlide){
       var thisSectionId = $(this).parents('.section').data('section-id');
       if (thisSectionId == video.sectionId) {
      if (video.container.data('slide-id') == nextSlide) {
          // if (!Modernizr.touchevents) {
          if (document.documentElement.classList.contains('no-touchevents')) {
            if (nextSlide !== currentSlide ) {//check if is first slide and is first load
              setTimeout(function() {
                if (video.host === hosts.html5) {
                    video.player.play();
                }
                if (video.host === hosts.youtube && video.player.playVideo) {
                    video.player.playVideo();
                }
              }, 300);
            }
          }
        }
      }
  });
  //on media hidden
  productCarousel.on('afterChange', function(event, slick, currentSlide){
    var thisSectionId = $(this).parents('.section').data('section-id');
       if (thisSectionId == video.sectionId) {
          if (video.container.data('slide-id') != currentSlide) {
          if (video.host === hosts.html5) {
              video.player.pause();
          }
          if (video.host === hosts.youtube && video.player.pauseVideo) {
              video.player.pauseVideo();
          }
          }
        }
    });

    //on XR launch
  $(document).on('shopify_xr_launch', function() {
    if (video.host === hosts.html5) {
          video.player.pause();
      }
      if (video.host === hosts.youtube && video.player.pauseVideo) {
          video.player.pauseVideo();
      }
  });
  }

  function hostFromVideoElement(video) {
    if (video.tagName === 'VIDEO') {
      return hosts.html5;
    }
    if (video.tagName === 'IFRAME') {
      if (
        /^(https?:\/\/)?(www\.)?(youtube\.com|youtube-nocookie\.com|youtu\.?be)\/.+$/.test(
          video.src
        )
      ) {
        return hosts.youtube;
      }
    }
    return null;
  }

  function loadVideos(host) {
    for (var key in videos) {
      if (videos.hasOwnProperty(key)) {
        var video = videos[key];
        if (video.host === host) {
          video.ready();
        }
      }
    }
  }

  function removeSectionVideos(sectionId) {
    for (var key in videos) {
      if (videos.hasOwnProperty(key)) {
        var video = videos[key];
        if (video.sectionId === sectionId) {
          if (video.player) video.player.destroy();
          delete videos[key];
        }
      }
    }
  }

  return {
    init: init,
    hosts: hosts,
    loadVideos: loadVideos,
    removeSectionVideos: removeSectionVideos
  };
})();

theme.ProductModel = (function() {
  var modelJsonSections = {};
  var models = {};
  var xrButtons = {};
  var productCarousel = $('.js-product-slider');

  var selectors = {
    mediaGroup: '[data-product-media-group]',
    xrButton: '[data-shopify-xr]'
  };

  function init(modelViewerContainers, sectionId) {
    modelJsonSections[sectionId] = {
      loaded: false
    };

    modelViewerContainers.each(function(index) {
      var $modelViewerContainer = $(this);
      var mediaId = $modelViewerContainer.data('media-id');
      var $modelViewerElement = $(
        $modelViewerContainer.find('model-viewer')[0]
      );
      var modelId = $modelViewerElement.data('model-id');

      if (index === 0) {
        var $xrButton = $modelViewerContainer
          .closest(selectors.mediaGroup)
          .find(selectors.xrButton);
        xrButtons[sectionId] = {
          $element: $xrButton,
          defaultId: modelId
        };
      }

      models[mediaId] = {
        modelId: modelId,
        sectionId: sectionId,
        $container: $modelViewerContainer,
        $element: $modelViewerElement
      };
    });

    window.Shopify.loadFeatures([
      {
        name: 'shopify-xr',
        version: '1.0',
        onLoad: setupShopifyXr
      },
      {
        name: 'model-viewer-ui',
        version: '1.0',
        onLoad: setupModelViewerUi
      }
    ]);
    theme.LibraryLoader.load('modelViewerUiStyles');
  }

  function setupShopifyXr(errors) {
    if (errors) return;

    if (!window.ShopifyXR) {
      document.addEventListener('shopify_xr_initialized', function() {
        setupShopifyXr();
      });
      return;
    }

    for (var sectionId in modelJsonSections) {
      if (modelJsonSections.hasOwnProperty(sectionId)) {
        var modelSection = modelJsonSections[sectionId];

        if (modelSection.loaded) continue;
        var $modelJson = $('#ModelJson-' + sectionId);

        window.ShopifyXR.addModels(JSON.parse($modelJson.html()));
        modelSection.loaded = true;
      }
    }
    window.ShopifyXR.setupXRElements();
  }

  function setupModelViewerUi(errors) {
    if (errors) {
      // When loadFeature is implemented, you can console or throw errors by doing something like this:
      // errors.forEach((error) => { console.warn(error.message); });
      return;
    }
    for (var key in models) {
      if (models.hasOwnProperty(key)) {
        var model = models[key];
        if (!model.modelViewerUi) {
          model.modelViewerUi = new Shopify.ModelViewerUI(model.$element);
        }
        setupModelViewerListeners(model);
      }
    }
  }

  function setupModelViewerListeners(model) {
        var xrButton = xrButtons[model.sectionId];

    //on media reveal
       productCarousel.on('beforeChange', function(event, slick, currentSlide, nextSlide){
         var thisSectionId = $(this).parents('.section').data('section-id');
         if (thisSectionId == model.sectionId) {
           if (model.$container.data('slide-id') == nextSlide) {
              // if (!Modernizr.touchevents) {
              if (document.documentElement.classList.contains('no-touchevents')) {
                if (nextSlide !== currentSlide ) {//check if is first slide and is first load
                  xrButton.$element.attr('data-shopify-model3d-id', model.modelId);
                  setTimeout(function() {
                model.modelViewerUi.play();
                }, 300);
                }
              }
              $(this).slick("slickSetOption", "swipe", false);
            }
          }
    });
    //on media hidden
    productCarousel.on('beforeChange', function(event, slick, currentSlide, nextSlide){
      var thisSectionId = $(this).parents('.section').data('section-id');
         if (thisSectionId == model.sectionId) {
            if (model.$container.data('slide-id') == currentSlide && model.$container.data('slide-id') != nextSlide) {
              xrButton.$element.attr('data-shopify-model3d-id', xrButton.defaultId);
              model.modelViewerUi.pause();
              $(this).slick("slickSetOption", "swipe", true);
            }
        }
      });

    //on XR launch
    $(document).on('shopify_xr_launch', function() {
      model.modelViewerUi.pause();
    });
  }

  function removeSectionModels(sectionId) {
    for (var key in models) {
      if (models.hasOwnProperty(key)) {
        var model = models[key];
        if (model.sectionId === sectionId) {
          delete models[key];
        }
      }
    }
    delete modelJsonSections[sectionId];
  }

  return {
    init: init,
    removeSectionModels: removeSectionModels
  };
})();


theme.productMediaInit = function(gallery) {
  const $gallery = $(gallery);
  const [section] = $gallery.closest('.section');

  $gallery.find('.media-gallery__item--video').each(function(index) {
    theme.ProductVideo.init($(this), $(section).data('section-id'));
  });
  if ($gallery.find('.media-gallery__item--model').length > 0) {
    theme.ProductModel.init($gallery.find('.media-gallery__item--model'), $(section).data('section-id'));
  }
};

class VariantSelects extends HTMLElement {
  constructor() {
    super();
    this.productAvailable = this.getVariantData().some((variant) => variant.available);
    this.uniqueId = this.dataset.card || this.dataset.section;
    this.addEventListener('change', this.onVariantChange);
  }

  onVariantChange() {
    this.updateOptions();
    this.updateMasterId();
    this.updatePickupAvailability();
    this.removeErrorMessage();

    if (!this.currentVariant) {
      this.toggleAddButton(true, '', true);
      this.setUnavailable();
    } else {
      this.updateMedia();
      this.updateURL();
      this.updateVariantInput();
      this.renderProductInfo();
    }

    this.dispatchEvent(new CustomEvent('variants:change', {
      detail: {
        variant: this.currentVariant
      }
    }));
  }

  updateOptions() {
    this.options = Array.from(
      this.querySelectorAll('select'),
      (select) => select.value
    );
  }

  updateMasterId() {
    this.currentVariant = this.getVariantData().find((variant) => {
      return !variant.options
        .map((option, index) => {
          return this.options[index] === option;
        })
        .includes(false);
    });
  }

  updateMedia() {
    if (!this.currentVariant) return;
    if (!this.currentVariant.featured_media) return;

    const slider = $(`.section--${this.uniqueId} .js-product-slider`);

    if(slider.length > 0){
      const mediaId = this.currentVariant.featured_media.id;
      const slide = $(`.section--${this.uniqueId} .media-gallery__item[data-media-id*=${mediaId}]`);
      const slideId = slide.attr("data-slide-id");

      slider.slick("slickGoTo", slideId);
    } else {
      const getSrcSet = (src) =>
        [180, 360, 540, 720, 900, 1080, 1296, 1512].reduce((srcSetString, imageSize) => {
          const currSrc = src.replace(/\.jpg|\.png|\.gif|\.jpeg/g, (match) => {
            return `_${imageSize}x${match}`;
          });
          return srcSetString.concat(`${currSrc} ${imageSize}w ${imageSize}h, `);
        }, '');

      const currImage = $(`.section--${this.uniqueId} .js-img-modal`);
      const featureImageSrc = this.currentVariant.featured_image.src.replace(/\.jpg|\.png|\.gif|\.jpeg/g, function(match) {
          return '_300x'+match;
        });

      currImage.attr("src", featureImageSrc);
      currImage.attr("srcset", getSrcSet(this.currentVariant.featured_image.src));
    }
  }

  updateURL() {
    if (!this.currentVariant || this.dataset.updateUrl === 'false') return;
    window.history.replaceState(
      {},
      '',
      `${this.dataset.url}?variant=${this.currentVariant.id}`
    );
  }

  updateVariantInput() {
    // TODO: Installment?
    const productForms = document.querySelectorAll(`#product-form-${this.uniqueId}, #product-form-installment-${this.uniqueId}`);
    productForms.forEach((productForm) => {
      const input = productForm.querySelector('input[name="id"]');
      input.value = this.currentVariant.id;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  updatePickupAvailability() {
    const pickupAvailability = document.querySelector(`pickup-availability`);
    if (!pickupAvailability) return;

    pickupAvailability.fetchAvailability(this.currentVariant.id);
  }

  removeErrorMessage() {
    const section = this.closest('section');
    if (!section) return;

    $(section).find('.qty-error').remove();
  }

  renderProductInfo() {
    const priceContainer = document.getElementById(`price-${this.uniqueId}`);

    if (priceContainer) {
      const variantPrice = `
        <span class="u-hidden-visually">${window.theme.t.regular_price}</span>
          <span class="price__number ${ this.currentVariant.compare_at_price > this.currentVariant.price ? 'price__number--sale' : ''}">
          <span class="money">${
            Shopify.formatMoney(
              this.currentVariant.price,
              theme.money_format
            )}
          </span>
        </span>
        ${ this.currentVariant.compare_at_price > this.currentVariant.price ? `
          <span class="u-hidden-visually">${window.theme.t.sale_price}</span>
          <s class="price__compare">
            <span class="money">${
              Shopify.formatMoney(
                this.currentVariant.compare_at_price,
                theme.money_format
              )}
            </span>
          </s>
        ` : '' }
      `;

      priceContainer.innerHTML = variantPrice;
    }

    const unitPriceContainer = document.getElementById(`unit-price-${this.uniqueId}`);

    if (unitPriceContainer) {
      const unitPrice = this.currentVariant.unit_price ? `
        <span class="u-hidden-visually">${window.theme.t.unit_price_label}</span>
        <span class="money">${Shopify.formatMoney(this.currentVariant.unit_price, theme.money_format)}</span>
        <span aria-hidden="true">/</span>
        <span class="u-hidden-visually">${window.theme.t.unit_price_separator}&nbsp;</span>
        <span>
          ${this.productAvailable && this.currentVariant.unit_price_measurement ? `
            ${this.currentVariant.unit_price_measurement.reference_value !== 1 ? this.currentVariant.unit_price_measurement.reference_value : ''}
            ${this.currentVariant.unit_price_measurement.reference_unit}
          ` : ''}
        </span>
      ` : '';

      unitPriceContainer.innerHTML = unitPrice;
    }

    const labelContainer = document.getElementById(`label-${this.uniqueId}`);

    if (labelContainer) {
      if (this.currentVariant.compare_at_price > this.currentVariant.price) {
        const labelType = labelContainer.dataset.type;
        let text;

        switch (labelType) {
          case 'currency':
            const discountInCurrency = Shopify.formatMoney(Math.round(this.currentVariant.compare_at_price - this.currentVariant.price), theme.money_format);
            text = window.theme.t.discount_currency.replace('[discount]', discountInCurrency);
            break;
          case 'percentage':
            const discountInPercentage = Math.round((this.currentVariant.compare_at_price - this.currentVariant.price) * 100 / this.currentVariant.compare_at_price);
            text = window.theme.t.discount_percentage.replace('[discount]', discountInPercentage);
            break;
          case 'text':
          default:
            text = window.theme.t.discount_text;

        }

        const label = `
          <div class="label">
            <div class="label__text">${text}</div>
          </div>
        `;

        labelContainer.innerHTML = label;
      } else {
        labelContainer.innerHTML = '';
      }
    }

    const inventoryNoticeContainer = document.getElementById(`inventory-notice-${this.uniqueId}`);

    if (inventoryNoticeContainer) {

      const inventoryNoticeWrapperContainer = inventoryNoticeContainer.querySelector('.product-form__stock-note');
      const inventoryNoticeTextContainer = inventoryNoticeContainer.querySelector('.product-form__stock-note-text');

      const inventoryShowQty = inventoryNoticeContainer.dataset.showQty;
      const inventoryLimit = Number(inventoryNoticeContainer.dataset.inventoryLimit);
      const currentVariantQuantity = Number(document.getElementById(`quantity-${this.uniqueId}-${this.currentVariant.id}`).dataset.qty);

      const soldClass = 'product-form__stock-note--sold';
      const inStockClass = 'product-form__stock-note--in-stock';
      const lowStockClass = 'product-form__stock-note--low';

      //if sold out
      if (!this.currentVariant.available) {
        //adjust wrapper classes
        inventoryNoticeWrapperContainer.classList.remove(inStockClass, lowStockClass);
        inventoryNoticeWrapperContainer.classList.add(soldClass);
        //change notice text
        inventoryNoticeTextContainer.innerHTML = `${window.theme.t.qty_notice_sold_out}`;

      //if available, tracks quantity and show quantity number setting is TRUE
      } else if (this.currentVariant.inventory_management === 'shopify' && inventoryShowQty === 'true') {
        //adjust wrapper classes
        inventoryNoticeWrapperContainer.classList.remove(soldClass, lowStockClass);
        inventoryNoticeWrapperContainer.classList.add(inStockClass);

        if (currentVariantQuantity <= inventoryLimit) {
          //add low quantity wrapper class
          inventoryNoticeWrapperContainer.classList.add(lowStockClass);
          //change notice text (low stock with number)
          inventoryNoticeTextContainer.innerHTML = `${window.theme.t.qty_notice_number_low_stock_html.replace('[qty]', currentVariantQuantity)}`;

        } else {
          //change notice text (in stock with number)
          inventoryNoticeTextContainer.innerHTML = `${window.theme.t.qty_notice_number_in_stock_html.replace('[qty]', currentVariantQuantity)}`;
        }

      //if available, tracks quantity but show quantity number setting is FALSE
      } else if (this.currentVariant.inventory_management === 'shopify' && inventoryShowQty === 'false') {

        //adjust wrapper classes
        inventoryNoticeWrapperContainer.classList.remove(soldClass, lowStockClass);
        inventoryNoticeWrapperContainer.classList.add(inStockClass);

        if (currentVariantQuantity <= inventoryLimit) {
          //add low quantity wrapper class
          inventoryNoticeWrapperContainer.classList.add(lowStockClass);
          //change notice text (low stock)
          inventoryNoticeTextContainer.innerHTML = `${window.theme.t.qty_notice_low_stock}`;

        } else {
          //change notice text (in stock)
          inventoryNoticeTextContainer.innerHTML = `${window.theme.t.qty_notice_in_stock}`;
        }

      //if available but quantity is not tracked
      } else {
        //adjust wrapper classes
        inventoryNoticeWrapperContainer.classList.remove(soldClass, lowStockClass);
        inventoryNoticeWrapperContainer.classList.add(inStockClass);

        //change notice text (in stock)
        inventoryNoticeTextContainer.innerHTML = `${window.theme.t.qty_notice_in_stock}`;
      }
    }

    const skuContainer = document.getElementById(`sku-${this.uniqueId}`);

    if (skuContainer) {
      const sku = this.currentVariant.sku ? `
        <div class="product-form__swatch__title u-small">${skuContainer.dataset.skuLabel ? `${skuContainer.dataset.skuLabel}&nbsp;` : ''}<span class="product-form__swatch__sub-title">${this.currentVariant.sku}</span></div>
      ` : '';

      skuContainer.innerHTML = sku;
    }

    this.toggleAddButton(
      !this.currentVariant.available,
      window.theme.t.sold_out
    );
  }

  toggleAddButton(disable = true, text = '', modifyClass = true) {
    const productForm = document.getElementById(
      `product-form-${this.uniqueId}`
    );
    if (!productForm) return;
    const buttonsContainer = productForm.querySelector('.js-product-buttons');
    const addButton = productForm.querySelector('[name="add"]');
    const addButtonText = productForm.querySelector('[name="add"] > span');
    if (!addButton) return;

    if (disable) {
      addButton.setAttribute('disabled', 'disabled');
      if (text) addButtonText.textContent = text;
      buttonsContainer.classList.add('is-disabled');
    } else {
      addButton.removeAttribute('disabled');
      addButtonText.textContent = window.theme.t.add_to_cart;
      buttonsContainer.classList.remove('is-disabled');
    }

    if (!modifyClass) return;
  }

  setUnavailable() {
    const productForm = document.getElementById(
      `product-form-${this.uniqueId}`
    );
    const addButton = productForm.querySelector('[name="add"]');
    const addButtonText = productForm.querySelector('[name="add"] > span');
    const price = document.getElementById(`price-${this.uniqueId}`);
    if (!addButton) return;
    addButtonText.textContent = window.theme.t.unavailable;
    if (price) price.classList.add('visibility-hidden');
  }

  getVariantData() {
    this.variantData =
      this.variantData ||
      JSON.parse(this.querySelector('[type="application/json"]').textContent);
    return this.variantData;
  }
}

customElements.define('variant-selects', VariantSelects);

class VariantRadios extends VariantSelects {
  constructor() {
    super();
  }

  updateOptions() {
    const fieldsets = Array.from(this.querySelectorAll('fieldset'));
    this.options = fieldsets.map((fieldset) => {
      return Array.from(fieldset.querySelectorAll('input')).find(
        (radio) => radio.checked
      ).value;
    });
  }
}

customElements.define('variant-radios', VariantRadios);

class VariantSwatches extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.currentSelection = this.querySelector('input:checked').value;

    const form = this.closest('form');
    if (form) {
      form.addEventListener('change', () => {
        this.updateLabel();
      });
    } else {
      this.addEventListener('change', () => {
        this.updateLabel();
      });
    }
  }

  updateLabel() {
    const currentSelection = this.querySelector('input:checked').value;
    if (currentSelection !== this.currentSelection) {
      const labelOptionElement = this.querySelector('.js-option-title');
      labelOptionElement.innerHTML = currentSelection;
      this.currentSelection = currentSelection;
    }
  }
}

customElements.define('variant-swatches', VariantSwatches);

class VariantMixedInputs extends VariantSelects {
  updateOptions() {
    this.options = Array.from(
      this.querySelectorAll('input:checked, select'),
      (element) => element.value,
    );
  }
}

customElements.define('variant-mixed-inputs', VariantMixedInputs);

// ====================================================
// Slideshow section functions & video background logic
// ====================================================
theme.homeMainCarouselInit = function(carousel) {
  var $carousel = $(carousel);
  var currWinWidth = $(window).width();
  var mobileCond = currWinWidth >= 1;

  function loadVideos(thisCarousel) {
    var players = $(thisCarousel).find(".js-home-carousel-video-data");

    function onReadyVideo(event) {

      var iFrameSelector = '[data-video-id="' + event.target.getVideoData().video_id + '"]';
      var iFrameTarget = document.querySelector(iFrameSelector);

      event.target.mute();
      theme.videoSize(iFrameTarget);

      //check if this slide is active and play video if so
      if (
      $(iFrameTarget)
        .parents(".slick-slide")
        .hasClass("slick-active")
      ) {
        event.target.playVideo();
        //adding timeout so video cover waits for youtube to start playing
        setTimeout(function() {
          $(iFrameTarget)
          .parent()
          .addClass("js-loaded");
        }, 800);
      }
    }

    function onChangeVideo(event) {
      if (event.data === YT.PlayerState.ENDED) {
        //when video ends - repeat
        event.target.playVideo();
      }
    }

    for (var i = 0; i < players.length; i++) {
      window[players[i].getAttribute("data-player-id")] = new YT.Player(
        players[i],
        {
          videoId: players[i].getAttribute("data-video-id"),
          host: 'https://www.youtube.com',
          playerVars: {
            iv_load_policy: 3,
            modestbranding: 1,
            playsinline: 1,
            cc_load_policy: 0,
            fs: 0,
            autoplay: 1,
            mute: 1,
            controls: 0,
            showinfo: 0,
            wmode: "opaque",
            quality: 'hd720',
            branding: 0,
            autohide: 0,
            rel: 0
          },
          events: {
            onReady: onReadyVideo,
            onStateChange: onChangeVideo
          }
        }
      );
    }
  }

  $carousel.on("init", function(event, slick) {

    // remove loading classes
    $carousel.closest('.home-carousel-wrapper').removeClass(function (index, className) {
      var newClasses = (className.match (/\bhome-carousel-wrapper--loading\S*/g) || []).join(' ');
      return newClasses;
    });
    $carousel.removeClass('home-carousel--loading');
    $carousel.removeClass('home-carousel--image--loading');

    //check if this carousel has youtube videos
    if ($carousel.find(".js-home-carousel-video--yt").length) {
      if (mobileCond) {
        //check if youtube API is loaded
        if (typeof YT === "undefined") {
          // insert youtube iframe API
          $.getScript("https://www.youtube.com/iframe_api")
          //after loaded
          .done(function() {
            var interval = setInterval(function() {
              //check if YT is function and loop if not
              if (typeof YT.Player === 'function') {
                loadVideos($carousel);
                clearInterval(interval);
              }
            }, 100);
          });
        } else {
          loadVideos($carousel);
        }
      }
    }

    //check if this carousel has self hosted videos
    if ($carousel.find(".js-home-carousel-video--self").length) {
      // check if self hosted video is first slide and initiate active class
      if ($carousel.find("[data-slide-id='0']").find('.js-home-carousel-video--self').length) {
        var $selfVideo = $carousel.find("[data-slide-id='0']").find('.js-home-carousel-video--self');
        // TODO: Check video load event
        setTimeout(function() {
          $selfVideo.addClass("js-loaded");
        }, 300);
      }
    }

    //content loading classes
    $(this)
      .find(".slick-active")
      .addClass("js-slide-active");
  });

  $carousel.on("afterChange", function(event, slick, currentSlide) {
    if (mobileCond) {
      //for youtube

      var $currentSlideElement = $carousel.find("[data-slide-id='" + currentSlide + "']");

      if ($currentSlideElement.find(".js-home-carousel-video--yt").length) {
        var dataPlayerId = $(this)
          .find(".slick-active .js-home-carousel-video-data")
          .attr("data-player-id");

        if (window[dataPlayerId].B) {
          //check if element is ready
          window[dataPlayerId].playVideo();
        } else {
          setTimeout(function() {
            window[dataPlayerId].playVideo();
          }, 1000);
        }

        var thisYTVideo = $(this).find(
          ".slick-active .js-home-carousel-video"
        );
        //adding timeout so video cover waits for youtube to initiate loading
        // TODO: Load event?
        setTimeout(function() {
          thisYTVideo.addClass("js-loaded");
        }, 800);
      }

      //for self hosted
      if ($currentSlideElement.find(".js-home-carousel-video--self").length) {
        var $selfVideo = $carousel.find(
          ".slick-active .js-home-carousel-video"
        );
        setTimeout(function() {
          $selfVideo.addClass("js-loaded");
        }, 300);
      }
    }

    //class is used to delay first slide content animation
    $carousel.removeClass('home-carousel--animation-loading');

    //content loading classes
    $carousel
      .find(".slick-slide")
      .removeClass("js-slide-active");
    $carousel
      .find(".slick-active")
      .addClass("js-slide-active");
  });

  //reset scroll reveal geometry
  $carousel.on('setPosition', function reSync() {
    if (window.sr) window.sr.delegate();
  });

  $carousel.not(".slick-initialized").slick({
    accessibility: true,
    ariaPolite: false,
    slidesToShow: 1,
    slidesToScroll: 1,
    infinite: true,
    dots: true,
    fade: true,
    cssEase: "linear",
    adaptiveHeight: false,
    prevArrow: '<div class="home-carousel__nav__item home-carousel__nav__item--prev" tabindex="0"><i class="icon icon--left" tabindex="0"></i></div>',
    nextArrow: '<div class="home-carousel__nav__item home-carousel__nav__item--next" tabindex="0"><i class="icon icon--right" tabindex="0"></i></div>',
    appendDots: $carousel.parent().find('.js-home-carousel-nav-dots'),
    appendArrows: $carousel.parent().find('.js-home-carousel-nav')
  });

};

theme.homeMainCarousel = function() {
  var $carousels = $(".js-home-carousel");

  var homeMainCarouselObserver = generateFireOnViewObserver(theme.homeMainCarouselInit);

  if (homeMainCarouselObserver && !Shopify.designMode) {
    $carousels.each(function() {
      homeMainCarouselObserver.observe(this);
    });
  } else {
    $carousels.each(function() {
      theme.homeMainCarouselInit(this);
    });
  }

  //recalculate all iframe sizes on browser resize
  var videoResizeTimer;
  $(window).on('resize', function() {
    winWidth = $(window).width();
    clearTimeout(videoResizeTimer);
    videoResizeTimer = setTimeout(function() {
      theme.videoSize($(".js-home-carousel-video-data"));
    }, 500);
  });
};

theme.videoSize = function(video) {
  //set elems
  var iframe = $(video);

  //find video size
  var origHeight = iframe.attr("height");
  var origWidth = iframe.attr("width");

  //find element width and caclulate new height
  var parentHeight = iframe.parent().height();
  var parentWidth = iframe.parent().width();

  //calc height and width based on original ratio
  var newHeight = (parentWidth / origWidth) * origHeight;
  var newWidth = (parentHeight / origHeight) * origWidth;

  //check if video ratio fits with carousel container and add css settings
  // TODO: Change to transforms
  if (parentHeight < newHeight) {
    iframe.css({
      width: parentWidth + "px",
      height: newHeight + 120 + "px",
      top: (parentHeight - newHeight) / 2 - 60 + "px",
      left: 0
    });
  } else {
    iframe.css({
      width: newWidth + "px",
      height: parentHeight + 120 + "px",
      left: (parentWidth - newWidth) / 2 + "px",
      top: '-60px'
    });
  }
};

// ========================
// Home video gallery logic
// ========================
theme.homeVideoGalleryPlayers = [];

theme.homeVideoGalleryInit = function(videoStageElement) {
  var $videoStage = $(videoStageElement);

  function vimeoThumbs() {
    //iteration for all thumbs while waiting for ajax to complete
    var i = 0;
    var $vimeoThumbs = $videoStage.parent().find(".js-vimeo-thumb");
    var $vimeoPlaceholder = $videoStage.find(".js-vimeo-placeholder");

    function next() {
      if (i < $vimeoThumbs.length) {
        thisThumb = $vimeoThumbs[i];
        var vimeoID = $(thisThumb).attr("data-video-id");

        $.ajax({
          url: "https://vimeo.com/api/oembed.json?url=https://vimeo.com/" + vimeoID,
          dataType: "json",
          complete: function(data) {
            $(thisThumb).attr(
              "src",
              data.responseJSON.thumbnail_url
            );
            $(thisThumb).css('opacity', '1');
            i++;
            next();
          }
        });
      }
    }
    // kick off the first thumb iteration
    next();

    //placeholder thumb
    if ($vimeoPlaceholder.length > 0) {
      var vimeoID = $vimeoPlaceholder.attr("data-video-id");

      $.ajax({
        url: "https://vimeo.com/api/oembed.json?url=https://vimeo.com/" + vimeoID,
        dataType: "json",
        success: function(data) {
          var img = data.thumbnail_url.split('_')[0]  + "_1280.jpg";
          $vimeoPlaceholder.attr("src", img);
          $vimeoPlaceholder.css('opacity', '1');
        }
      });
    }
  }

  vimeoThumbs();

  $videoStage.find('.js-lazy-iframe').each(function() {
    $(this).attr("src", $(this).data('src')).removeAttr('data-src');
  });

  theme.LibraryLoader.load('plyr', function() {
    theme.LibraryLoader.load('plyrShopifyStyles', function() {
      $videoStage.find('.js-home-video-player').each(function() {
        var video = this;
        var videoId = $(video).attr("id");

        //setup each player with unique var
        window[videoId] = new Plyr(video, {
          controls: [
            'play',
            'progress',
            'mute',
            'volume',
            'fullscreen'
          ],
          youtube: { noCookie: false },
          loop: {
            active: false
          },
          hideControlsOnPause: true,
          iconUrl: '//cdn.shopify.com/shopifycloud/shopify-plyr/v1.0/shopify-plyr.svg',
          tooltips: {
            controls: false,
            seek: true
          }
        });

        //array of all players for mass functions
        theme.homeVideoGalleryPlayers.push(window[videoId]);
      });
    });
  });
};

theme.homeVideoGallery = function() {
  var $videos = $('.js-home-video-stage');

  var homeVideoGalleryObserver = generateFireOnViewObserver(theme.homeVideoGalleryInit);

  if ($videos.length > 0) {
    if (homeVideoGalleryObserver && !Shopify.designMode) {
      $videos.each(function() {
        homeVideoGalleryObserver.observe(this);
      });
    } else {
      $videos.each(function() {
        theme.homeVideoGalleryInit(this);
      });
    }
  }

  //placeholder click
  $(document).on('click', '.js-home-video-placeholder-trigger', function(e) {
    e.preventDefault();

    var triggerTarget = $(this).attr("href");
    var triggerId = $(this)
      .attr("href")
      .replace(/#/, "");

    //hide placeholder
    $(this)
      .parent(".js-home-video-placeholder")
      .addClass("js-hidden");

    //pause all videos if playing
    theme.homeVideoGalleryPlayers.forEach(function(instance) {
      instance.pause();
    });

    //start video
    window["home_player_" + triggerId].play();

    $( ".home-video__stage-video .plyr__controls" ).css( "display", "flex" );
  });

  //thumbs click
  $(document).on('click', '.js-home-video-trigger', function(e) {
    e.preventDefault();

    var triggerId = $(this)
      .attr("href")
      .replace(/#/, "");
    var triggerTarget = "#js-home-video-" + triggerId;
    var sectionPlaceholder = $(this)
      .parents(".home-video")
      .find(".js-home-video-placeholder");

    //hide placeholder
    sectionPlaceholder.addClass("js-hidden");

    //remove and add active class
    $(this)
      .parents(".home-video")
      .find(".js-home-video")
      .removeClass("js-active");
    $(triggerTarget).addClass("js-active");

    //pause all videos
    theme.homeVideoGalleryPlayers.forEach(function(instance) {
      instance.pause();
    });

    //pause on second click and play function
    if (
      $(this)
      .parent()
      .hasClass("js-paused")
    ) {
      window["home_player_" + triggerId].play();
      $(this)
      .parent()
      .removeClass("js-paused");
    } else if (
      $(this)
      .parent()
      .hasClass("js-active")
    ) {
      $(this)
      .parent()
      .addClass("js-paused");
    } else {
      // console.log(window["home_player_" + triggerId]);
      window["home_player_" + triggerId].play();
    }

    //set correct thumb to active
    $(".js-home-video-trigger")
      .parent()
      .removeClass("js-active");
    $(".js-home-video-trigger")
      .parent()
      .removeClass("js-init");
    $(this)
      .parent()
      .addClass("js-active");
  });
};

theme.masonryLayout = function() {
  // Masonry layout init
  if (document.querySelector('.o-layout--masonry') !== null) {

    theme.LibraryLoader.load(
      'masonry',
      masonryInit
    );
  }

  function masonryInit() {
    $(".o-layout--masonry")
    .imagesLoaded()
    .always(function(instance) {
      $(".o-layout--masonry").masonry({
        itemSelector: ".o-layout__item",
        transitionDuration: 0
      });

      //reset scroll reveal geometry
      if (window.sr) window.sr.delegate();
    })
    // Run masonry while loading images
    .progress(function(instance, image) {
      $(".o-layout--masonry").masonry({
        itemSelector: ".o-layout__item",
        transitionDuration: 0
      });

      //reset scroll reveal geometry
      if (window.sr) window.sr.delegate();
    });
  }
};

theme.animScroll = function() {
  if ($("body").data("anim-load")) {
    theme.intervalStyle = {};

    if ($("body").data("anim-interval-style") == "fade_down") {
      theme.intervalStyle = "-10px";
    } else if ($("body").data("anim-interval-style") == "fade_up") {
      theme.intervalStyle = "10px";
    } else {
      theme.intervalStyle = "0";
    }

    theme.intervalValue = {};
    if ($("body").data("anim-interval")) {
      theme.intervalValue = 50;
    } else {
      theme.intervalValue = 0;
    }

    var config = {
      viewFactor: 0,
      duration: 550,
      distance: theme.intervalStyle,
      scale: 1,
      delay: 0,
      mobile: true,
      useDelay: "once",
      beforeReveal: function myCallback(el) {
        $(el).addClass("js-sr-loaded");
      }
    };

    window.sr = new ScrollReveal(config);

    //elements
    sr.reveal(".section__title", { distance: "5px" });
    sr.reveal(".section__title-desc", { distance: 0, delay: 100 });
    sr.reveal(".newsletter, .section__link, .account", { distance: 0 });

    //cart
    sr.reveal(".cart .section__title", { distance: "5px" });
    sr.reveal(".cart__announcement", { distance: 0 });
    sr.reveal(".cart__content", { distance: 0, delay: 100 });

    //search
    sr.reveal(".search-page .section__title", { distance: "5px" });
    sr.reveal(".search-page__form, .search-page__info, .search-page-pagination", {
      distance: 0,
      delay: 100
    });
    // sr.reveal(".search-page .product-card-top, .search-grid-item", {
    //   interval: theme.intervalValue,
    //   delay: 0
    // });

    //blog
    sr.reveal(".blog", { delay: 0, interval: theme.intervalValue });
    sr.reveal(".blog-page__tags, .blog-pagination", {
      distance: 0,
      delay: 100
    });
    sr.reveal(".blog-page .section__title", { distance: "5px" });

    //article
    sr.reveal(".article .section__title", { distance: "5px" });
    sr.reveal(
      ".article__date, .article__tags, .article__featured-media, .article__content, .article__meta",
      { distance: 0, delay: 100 }
    );
    sr.reveal(".article-paginate", { distance: 0, delay: 0 });

    //collection page
    sr.reveal(".collection__header-info__title", { distance: "5px" });
    sr.reveal(".collection .product-card-top, .collection .search-grid-item", { interval: theme.intervalValue });
    sr.reveal(
      ".collection__header-media, .collection__header-info__text, .collection-empty, .collection-pagination, .collection__filters-active",
      { distance: 0, delay: 50 }
    );

    //collection list
    sr.reveal(".list-collections .section__title", { distance: "5px" });
    sr.reveal(".list-collections .collection-list__media", {
      scale: 1.05,
      interval: 50,
      duration: 500,
      easing: 'ease'
    });
    sr.reveal(".list-collections .collection-list__content", {
      interval: 150,
      origin: 'bottom',
      duration: 500
    });

    //product page
    sr.reveal(".media-gallery__slider", { distance: 0 });
    sr.reveal(".product-single__title", { distance: "5px", cleanup: true });
    sr.reveal(".product-single .breadcrumb", { distance: 0, delay: 50 });

    //page
    sr.reveal(".page .section__title", { distance: "5px" });
    sr.reveal(".faq__cta", { distance: 0, delay: 100 });
    sr.reveal(".faq__accordion", { distance: 0, delay: 200 });
    sr.reveal(".faq__category__title", { distance: 0 });
    sr.reveal(".page__contact-form", { distance: 0, delay: 100 });

    //sections
    sr.reveal(".home-carousel .section__title", { distance: 0 });
    sr.reveal(".home-image-grid__item", { interval: theme.intervalValue });
    sr.reveal(".image-with-text__box");
    sr.reveal(".image-with-text__media", { distance: 0 });
    sr.reveal(".home-intro", { distance: 0 });
    sr.reveal(
      ".home-intro__media, .home-intro__text, .home-intro__video, .home-intro__link-wrap"
    );
    sr.reveal(".home-logo-list__items", { distance: 0 });
    sr.reveal(".home-testimonials", { distance: 0 });

    sr.reveal(".product-featured__details", { distance: 0 });
    sr.reveal(".home-event__item", { interval: theme.intervalValue }); //also in eventFeed section for ajax
    sr.reveal(".home-delivery", { distance: 0 });
    sr.reveal(".home-delivery__content", { distance: theme.intervalStyle });
    sr.reveal(".home-map__items");
    sr.reveal(".home-rich-text__content", { distance: 0, delay: 100 });
    sr.reveal(".multi-column__item", { interval: theme.intervalValue });
    sr.reveal(".home-video__stage, .home-video__items", { distance: 0 });
    sr.reveal(".home-custom__item", { interval: theme.intervalValue });

    // sr.reveal("tabbed-content", { distance: 0, delay: 100, cleanup: true });
    // Featured collection section, not tabbed, with items not scrollable
    sr.reveal(".section--featured-collections > .container .grid-layout", { distance: 0, delay: 100, cleanup: true });

    // Scrollable items, unless inside tabbed-content
    const featuredCollectionCards = document.querySelectorAll('.section--featured-collections .product-card-top');
    featuredCollectionCards.forEach((el) => {
      const container = el.closest('[data-items]');
      const parentTab = container.closest('tab-panel');

      if (!parentTab) {
        sr.reveal(el, {
          container,
          origin: 'bottom',
          delay: 50,
          reset: true
        });
      }
    });

    //collections list content
    const collectionListSections = document.querySelectorAll('.section--collections-list');
    collectionListSections.forEach((el) => {

      const CollObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {

            const media = entry.target.querySelectorAll('.collection-list__media');
            const content = entry.target.querySelectorAll('.collection-list__content');

            setTimeout(function() {//setTimeout for consistent animation visibility

              sr.reveal(media, {
                container: entry.target.querySelector('[data-items]'),
                delay: 0,
                scale: 1.05,
                interval: 50,
                duration: 500,
                easing: 'ease'
              });

              sr.reveal(content, {
                container: entry.target.querySelector('[data-items]'),
                interval: 150,
                origin: 'bottom',
                duration: 500,
                delay: 0,
                reset: true
              });

            }, 80);

            CollObserver.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0
      });

      CollObserver.observe(el);

    });

    // Product Recommendations
    document.querySelectorAll('product-recommendations').forEach((container) => {
      const cardsToAnimate =
        container.querySelectorAll('.product-card-top');

      if (cardsToAnimate.length > 0) container.setAttribute('animated', '');

      cardsToAnimate.forEach((el) => {
        const container = el.closest('.grid-layout');

        window.sr.reveal(el, {
          container,
          interval: 50,
        });
      });
    });
  }
};

theme.thumbsCarouselInit = function(element) {
  var $sliderElement = $(element);
  var startSlide = $sliderElement.data('slideId') ? Number($sliderElement.data('slideId')) : 0;

  function isThumbContainerVertical(container) {
    return $(container).closest('.media-gallery').hasClass('media-gallery--thumbnails-aside') && window.matchMedia('(min-width: 768px)').matches;
  }

  function adjustThumbs(activeElement, container, behavior = 'instant') {
    /**
     * 1) Check if currentElement is fully or partially outside bounds
     * 		outsideBefore = container.leftBound + fullElementWidth > elementOuterRightBound
     * 		outsideAfter = container.rightBound - fullElementWidth < elementOuterLeftBound
     * 2) Find if there is a next element after if outsideAfter or previous if outsideBefore
     * 3) Move into view
     */
    if (!container) return;

    const isVertical = isThumbContainerVertical(container);
    const coordinatesMapping = {
      size: isVertical ? 'height' : 'width',
      start: isVertical ? 'top' : 'left',
      end: isVertical ? 'bottom' : 'right',
      marginBefore: isVertical ? 'marginTop' : 'marginLeft',
      marginAfter: isVertical ? 'marginBottom' : 'marginRight'
    };
    const activeElementMarginBefore = Number(window.getComputedStyle(activeElement)[coordinatesMapping.marginBefore].replace('px', ''));
    const activeElementMarginAfter = Number(window.getComputedStyle(activeElement)[coordinatesMapping.marginAfter].replace('px', ''));
    const activeElementFullWidth = activeElementMarginBefore + activeElement.getBoundingClientRect()[coordinatesMapping.size] + activeElementMarginAfter;

    const isActiveOutsideBefore = container.getBoundingClientRect()[coordinatesMapping.start] + activeElementFullWidth > activeElement.getBoundingClientRect()[coordinatesMapping.end] + activeElementMarginAfter;
    const isActiveOutsideAfter = !isActiveOutsideBefore && container.getBoundingClientRect()[coordinatesMapping.end] - activeElementFullWidth < activeElement.getBoundingClientRect()[coordinatesMapping.start] - activeElementMarginBefore;

    let displacement = 0;

    if (isActiveOutsideBefore) {
      displacement = activeElement.getBoundingClientRect()[coordinatesMapping.start] - activeElementMarginBefore - container.getBoundingClientRect()[coordinatesMapping.start];
    }

    if (isActiveOutsideAfter) {
      displacement = activeElement.getBoundingClientRect()[coordinatesMapping.end] + activeElementMarginAfter - container.getBoundingClientRect()[coordinatesMapping.end];
    }

    const elementBeforeActive = activeElement.previousSibling;

    if (elementBeforeActive) {
      const elementBeforeActiveMarginBefore = Number(window.getComputedStyle(activeElement)[coordinatesMapping.marginBefore].replace('px', ''));
      const elementBeforeActiveMarginAfter = Number(window.getComputedStyle(activeElement)[coordinatesMapping.marginAfter].replace('px', ''));
      const elementBeforeActiveFullWidth = elementBeforeActiveMarginBefore + elementBeforeActive.getBoundingClientRect()[coordinatesMapping.size] + elementBeforeActiveMarginAfter;
      const elementBeforeActiveIsOutside = container.getBoundingClientRect()[coordinatesMapping.start] + elementBeforeActiveFullWidth > elementBeforeActive.getBoundingClientRect()[coordinatesMapping.end] + elementBeforeActiveMarginAfter + 1;

      if (elementBeforeActiveIsOutside) {
        displacement = elementBeforeActive.getBoundingClientRect()[coordinatesMapping.start] - elementBeforeActiveMarginBefore - container.getBoundingClientRect()[coordinatesMapping.start];
      }
    }

    const elementAfterActive = activeElement.nextSibling;

    if (elementAfterActive) {
      const elementAfterActiveMarginBefore = Number(window.getComputedStyle(activeElement)[coordinatesMapping.marginBefore].replace('px', ''));
      const elementAfterActiveMarginAfter = Number(window.getComputedStyle(activeElement)[coordinatesMapping.marginAfter].replace('px', ''));
      const elementAfterActiveFullWidth = elementAfterActiveMarginBefore + elementAfterActive.getBoundingClientRect()[coordinatesMapping.size] + elementAfterActiveMarginAfter;
      const elementAfterActiveIsOutside = container.getBoundingClientRect()[coordinatesMapping.end] - elementAfterActiveFullWidth < elementAfterActive.getBoundingClientRect()[coordinatesMapping.start] - elementAfterActiveMarginBefore;

      if (elementAfterActiveIsOutside) {
        displacement = elementAfterActive.getBoundingClientRect()[coordinatesMapping.end] + elementAfterActiveMarginAfter - container.getBoundingClientRect()[coordinatesMapping.end];
      }
    }

    if (displacement) {
      container.scrollBy({
        top: isVertical ? displacement : 0,
        left: !isVertical ? displacement : 0,
        behavior: behavior
      });
    }
  }

  function navigationPagingVisibilityControl(thumbsContainer, prevPageElement, nextPageElement) {
    if (!thumbsContainer) return;

    const isVertical = isThumbContainerVertical(thumbsContainer);
    const coordinatesMapping = {
      scrollSize: isVertical ? 'scrollHeight' : 'scrollWidth',
      clientSize: isVertical ? 'clientHeight' : 'clientWidth'
    };

    if (thumbsContainer[coordinatesMapping.scrollSize] > thumbsContainer[coordinatesMapping.clientSize]) {
      prevPageElement.classList.remove('u-hidden');
      nextPageElement.classList.remove('u-hidden');
    } else {
      prevPageElement.classList.add('u-hidden');
      nextPageElement.classList.add('u-hidden');
    }
  }

  function navigationControl(thumbsContainer, prevPageElement, nextPageElement) {
    if (!thumbsContainer) return;

    const options = {
      root: thumbsContainer,
      rootMargin: '2px',
      threshold: 1
    };

    navigationPagingVisibilityControl(thumbsContainer, prevPageElement, nextPageElement);

    prevPageElement.addEventListener('click', () => {
      const isVertical = isThumbContainerVertical(thumbsContainer);
      thumbsContainer.scrollBy({
        top: isVertical ? 0 - thumbsContainer.getBoundingClientRect().height : 0,
        left: !isVertical ? 0 - thumbsContainer.getBoundingClientRect().width : 0,
        behavior: 'smooth'
      });
    });

    nextPageElement.addEventListener('click', () => {
      const isVertical = isThumbContainerVertical(thumbsContainer);
      thumbsContainer.scrollBy({
        top: isVertical ? thumbsContainer.getBoundingClientRect().height : 0,
        left: !isVertical ? thumbsContainer.getBoundingClientRect().width : 0,
        behavior: 'smooth'
      });
    });

    function callback (entries, observer) {
      entries.forEach(entry => {
        const containerRect = thumbsContainer.getBoundingClientRect();
        const targetRect = entry.target.getBoundingClientRect();

        const isVertical = isThumbContainerVertical(thumbsContainer);
        const coordinatesMapping = {
          dimension: isVertical ? 'height' : 'width',
          start: isVertical ? 'top' : 'left',
          end: isVertical ? 'bottom' : 'right'
        };

        // First element
        if (containerRect[coordinatesMapping.start] + targetRect[coordinatesMapping.dimension] >= targetRect[coordinatesMapping.end]) {
          prevPageElement.disabled = entry.isIntersecting;
        }
        // Last element
        if (containerRect[coordinatesMapping.end] - targetRect[coordinatesMapping.dimension] <= targetRect[coordinatesMapping.start]) {
          nextPageElement.disabled = entry.isIntersecting;
        }
      });
    }

    if (thumbsContainer.children.length > 3) {
      const observer = new IntersectionObserver(callback, options);

      observer.observe(thumbsContainer.children[0]);
      observer.observe(thumbsContainer.children[thumbsContainer.children.length - 1]);
    }
  }

  function calculateThumbsRatio(container, preferredThumbSize = 70, minContainerSize = 300) {
    const gap = Number(window.getComputedStyle(container).gap.split(' ')[0].replace('px', ''));
    const containerRect = container.getBoundingClientRect();
    const isVertical = isThumbContainerVertical(container);
    const dimension = isVertical ? 'height' : 'width';
    const containerSize = containerRect[dimension];
    const deviation = Math.floor(preferredThumbSize / 10);
    const getRatio = (currentContainerSize) => {
      const lowerBound = Math.floor(currentContainerSize / (preferredThumbSize + gap - deviation));
      const upperBound = Math.floor(currentContainerSize / (preferredThumbSize + gap + deviation));
      const finalRatio = upperBound > lowerBound ? upperBound : lowerBound;
      return finalRatio > 2 ? finalRatio : 3;
    };

    return containerSize <= minContainerSize ? getRatio(minContainerSize) : getRatio(containerSize);
  }

  // function setCSSVars(thumbsContainer, height, minHeight = 350) {
  function setCSSVars(thumbsContainer, preferredThumbWidth = 70, preferredThumbHeight = 70) {
    // const heightToSet = height > minHeight ? height : minHeight;

    // thumbsContainer.style.setProperty('--height', `${heightToSet}px`);
    const isVertical = isThumbContainerVertical(thumbsContainer);

    thumbsContainer.style.setProperty('--thumbRatio', calculateThumbsRatio(thumbsContainer, isVertical ? preferredThumbHeight : preferredThumbWidth));

    if (!isVertical) {
      thumbsContainer.style.setProperty('--justify', thumbsContainer.scrollWidth > thumbsContainer.clientWidth ? 'start' : 'center');
    } else {
      thumbsContainer.style.setProperty('--justify', 'start');
    }

    const navWrapper = thumbsContainer.closest('.js-product-slider-nav');
    if (navWrapper && !navWrapper.classList.contains('is-loaded')) navWrapper.classList.add('is-loaded');
  }

  function runAfterSlickInit(e) {
    const config = {
      attributes: true,
      childList: false,
      subtree: false
    };

    const callback = (mutationList, observer) => {
      for (const mutation of mutationList) {
        if (mutation.type === 'attributes' && mutation.target.classList.contains('slick-initialized')) {
          const $slider = $(mutation.target);
          var $sliderWrapper = $slider.parent();

          const [slickList] =  $slider.find('.slick-list');
          const [thumbWidthString, thumbHeightString] = ($slider[0].dataset.thumbnailsSize || '70:70').split(':');

          const thumbWidth = Number(thumbWidthString);
          const thumbHeight = Number(thumbHeightString);

          $sliderWrapper.removeClass('media-gallery--loading');
          $sliderWrapper.find('.js-product-slider-nav').removeClass('media-gallery__nav--loading');
          $slider.removeClass('media-gallery__slider--loading');

          const [thumbs] = $($slider.siblings('.js-product-slider-nav')[0]).find('.thumbnail-list');
          const [prevPageElement] = $($slider.siblings('.js-product-slider-nav')[0]).find('.js-nav-prev');
          const [nextPageElement] = $($slider.siblings('.js-product-slider-nav')[0]).find('.js-nav-next');

          if (thumbs) {
            const [track] = $slider.find('.slick-track');
            const currentSlideId = Array.from(track.children).findIndex(elem => elem.classList.contains('slick-current'));

            thumbs.children[currentSlideId].classList.add('thumbnail-list__item--active');
            thumbs.children[currentSlideId].querySelector('.thumbnail').setAttribute('aria-current', 'true');

            if('ResizeObserver' in window) {
              const observer = new ResizeObserver(debounce((entries) => {
                for (let entry of entries) {
                  const active = $(entry.target).find('.thumbnail-list__item--active')[0];
                  adjustThumbs(active, entry.target);

                  setCSSVars(entry.target, thumbWidth, thumbHeight);
                  navigationPagingVisibilityControl(entry.target, prevPageElement, nextPageElement);
                }
              }, 100));

              observer.observe(thumbs);

              const listObserver = new ResizeObserver(debounce((entries) => {
                for (let entry of entries) {
                  setCSSVars(thumbs, thumbWidth, thumbHeight);
                }
              }, 100));

              listObserver.observe(slickList);
            } else {
              const active = $slider.find('.thumbnail-list__item--active')[0];

              setCSSVars(thumbs, thumbWidth, thumbHeight);
              adjustThumbs(active, mutation.target);
              navigationPagingVisibilityControl(mutation.target, prevPageElement, nextPageElement);
            }

            // Set-up thumbnails events
            Array.from(thumbs.querySelectorAll('.thumbnail')).forEach((el) => {
              el.addEventListener('click', (e) => {
                const slideNumber = Number(e.target.dataset.slideNumber);

                $slider.slick('slickGoTo', slideNumber);
              });
            });
          }

          if (thumbs && prevPageElement && nextPageElement) {
            navigationControl(thumbs, prevPageElement, nextPageElement);
          }

          $slider.slick('slickSetOption', 'speed', 300);

          break;
        }
      }

      observer.disconnect();
    };

    const observer = new MutationObserver(callback);

    observer.observe(e, config);
  }

  function initiateSlick($sliderElement) {
    $sliderElement.slick( {
      focusOnSelect: true,
      accessibility: true,
      ariaPolite: false,
      slidesToShow: 1,
      slidesToScroll: 1,
      infinite: false,
      arrows: false,
      dots: false,
      swipe: true,
      adaptiveHeight: true,
      initialSlide: startSlide,
      mobileFirst: true,
      fade: false,
      speed: 0,
      responsive: [
        {
          breakpoint: 1081,
          settings: {
            fade: true,
            speed: 300,
            cssEase: 'ease-out'
          }
        }
      ]
    })
    .on('beforeChange', function(event, slick, currentSlide, nextSlideIndex) {
      const [thumbs] = $($sliderElement.siblings('.js-product-slider-nav')[0]).find('.thumbnail-list');

      if (thumbs) {
        // const dotsParentContainer = slick.$dots.closest('.js-product-slider-nav-dots')[0];
        const currentElement = thumbs.querySelector('.thumbnail-list__item--active');
        const nextElement = $(thumbs).children()[nextSlideIndex];

        currentElement.classList.remove('thumbnail-list__item--active');
        currentElement.querySelector('.thumbnail').removeAttribute('aria-current');

        nextElement.classList.add('thumbnail-list__item--active');
        nextElement.querySelector('.thumbnail').setAttribute('aria-current', 'true');

        adjustThumbs(nextElement, thumbs, 'smooth');
      }
    })
    .on('afterChange', function(event, slick, currentSlide) {
      // 3D model logic
      const [viewInSpaceButton] = $sliderElement.siblings('.js-product-view-in-space-btn');

      if (viewInSpaceButton) {
        const currentSlideElement = slick.$slides[currentSlide];
        const model = currentSlideElement.querySelector('.media-gallery__item--model');

        if (model) {
          viewInSpaceButton.dataset.shopifyModel3dId = model.dataset.mediaId;
        }
      }
    });
  }

  theme.productMediaInit(element);
  runAfterSlickInit(element);

  initiateSlick($sliderElement);
};

theme.thumbsCarousel = function() {
  var $mediaGalleries = $(".js-product-slider").not(".slick-initialized");

  var mediaGalleriesObserver = generateFireOnViewObserver(theme.thumbsCarouselInit);

  $mediaGalleries.each(function() {
    var mediaGallery = this;
    if (mediaGalleriesObserver && !Shopify.designMode) {
      mediaGalleriesObserver.observe(mediaGallery);
    } else {
      theme.thumbsCarouselInit(mediaGallery);
    }
  });
};

// ====================
// Logos carousel logic
// ====================
theme.logoCarouselUpdate = function(element) {
  var $carousel = $(element);

  //get sizes
  var winWidth = $(window).width();

  var slideCount = $carousel.data("carouselCount");

  var desktop = $carousel.data("carouselDesktop");
  var mobile = $carousel.data("carouselMobile");

  function logoCarouselInitFull($carousel, slideCount) {
    $carousel.not(".slick-initialized").slick({
      slidesToShow: slideCount,
      slidesToScroll: slideCount,
      arrows: true,
      dots: true,
      fade: false,
      adaptiveHeight: false,
      speed: 300,
      cssEase: "ease",
      lazyLoad: "progressive",
      prevArrow:
      '<div class="home-logo-list-carousel__nav home-logo-list-carousel__nav--prev" tabindex="0"><i class="icon icon--left-l" role="presentation" tabindex="0"></i></div>',
      nextArrow:
      '<div class="home-logo-list-carousel__nav home-logo-list-carousel__nav--next" tabindex="0"><i class="icon icon--right-l" role="presentation" tabindex="0"></i></div>',
      responsive: [
      {
        breakpoint: theme.mobileBrkp,
        settings: {
        swipeToSlide: true,
        variableWidth: true,
        slidesToShow: 1,
        slidesToScroll: 1
        }
      }
      ]
    });
  }

  function logoCarouselInitDesk($carousel, slideCount) {
    $carousel.not(".slick-initialized").slick({
      slidesToShow: slideCount,
      slidesToScroll: slideCount,
      arrows: true,
      dots: true,
      fade: false,
      adaptiveHeight: false,
      speed: 300,
      cssEase: "ease",
      lazyLoad: "progressive",
      prevArrow:
      '<div class="home-logo-list-carousel__nav home-logo-list-carousel__nav--prev" tabindex="0"><i class="icon icon--left-l" tabindex="0"></i></div>',
      nextArrow:
      '<div class="home-logo-list-carousel__nav home-logo-list-carousel__nav--next" tabindex="0"><i class="icon icon--right-l" tabindex="0"></i></div>'
    });
  }

  function logoCarouselInitMobile($carousel) {
    $carousel.not(".slick-initialized").slick({
      slidesToShow: 1,
      slidesToScroll: 1,
      swipeToSlide: true,
      variableWidth: true,
      arrows: false,
      dots: true,
      fade: false,
      adaptiveHeight: false,
      speed: 300,
      cssEase: "ease",
      lazyLoad: "progressive"
    });
  }

  $carousel.removeClass('home-logo-list-carousel--loading');

  if (desktop && mobile) {
    logoCarouselInitFull($carousel, slideCount);
  } else if (desktop) {
    if (winWidth >= theme.mobileBrkp) {
      logoCarouselInitDesk($carousel, slideCount);
    } else {
      //check if slick is initiated
      if ($carousel.hasClass("slick-initialized")) {
        //detach slick
        $carousel.slick("unslick");
      }
    }
  } else if (mobile) {
    if (winWidth < theme.mobileBrkp) {
      logoCarouselInitMobile($carousel);
    } else {
      //check if slick is initiated
      if ($carousel.hasClass("slick-initialized")) {
        //detach slick
        $carousel.slick("unslick");
      }
    }
  }
};

theme.logoCarouselInit = function(element) {
  theme.logoCarouselUpdate(element);

  $(window).on('resize', function updateLogoCarouselOnResize() {
    theme.logoCarouselUpdate(element);
  });
};

theme.logoCarousel = function() {
  var $carousels = $(".js-home-logo-list-carousel");

  var logoCarouselObserver = generateFireOnViewObserver(theme.logoCarouselInit);

  if ($carousels.length > 0) {
    $carousels.each(function() {
      var carousel = this;
      if (logoCarouselObserver && !Shopify.designMode) {
        logoCarouselObserver.observe(carousel);
      } else {
        theme.logoCarouselInit(carousel);
      }
    });
  }
};

// ===========================
// Testimonials carousel logic
// ===========================

theme.testimonialsCarouselUpdate = function(carouselElement) {
  //get sizes
  winWidth = $(window).width();

  var $carousel = $(carouselElement);

  desktop = $carousel.data("carouselDesktop");
  mobile = $carousel.data("carouselMobile");

  $carousel.removeClass('home-testimonials-carousel--loading');

  function initCarousel($carouselElement) {

    $carouselElement.not(".slick-initialized").slick({
      slidesToShow: 1,
      slidesToScroll: 1,
      arrows: true,
      dots: true,
      fade: false,
      adaptiveHeight: false,
      speed: 300,
      cssEase: "ease",
      lazyLoad: "progressive",
      prevArrow:
      '<div class="home-testimonials-carousel__nav home-testimonials-carousel__nav--prev" tabindex="0"><i class="icon icon--left-l" aria-label="Left Arrow Navigation Button" tabindex="0"></i></div>',
      nextArrow:
      '<div class="home-testimonials-carousel__nav home-testimonials-carousel__nav--next" tabindex="0"><i class="icon icon--right-l" aria-label="Right Arrow Navigation Button" tabindex="0"></i></div>'
    });
  }

  if (desktop && mobile) {
    initCarousel($carousel);
  } else if (desktop) {
    if (winWidth >= theme.mobileBrkp) {
      initCarousel($carousel);
    } else {
      //check if slick is initiated
      if ($carousel.hasClass("slick-initialized")) {
        //detach slick
        $carousel.slick("unslick");
      }
    }
  } else if (mobile) {
    if (winWidth < theme.mobileBrkp) {
      initCarousel($carousel);
    } else {
      //check if slick is initiated
      if ($carousel.hasClass("slick-initialized")) {
        //detach slick
        $carousel.slick("unslick");
      }
    }
  }
};

theme.testimonialsCarouselInit = function(carouselElement) {
  // if (!$(carouselElement).hasClass("slick-initialized")) {
    theme.testimonialsCarouselUpdate(carouselElement);

    $(window).on('resize', function() {
      theme.testimonialsCarouselUpdate(carouselElement);
    });
  // }
};

theme.testimonialsCarousel = function() {
  var carousels = $(".js-home-testimonials-carousel");

  var testimonialsCarouselObserver = generateFireOnViewObserver(theme.testimonialsCarouselInit);

  carousels.each(function() {
    var carousel = this;
    if (testimonialsCarouselObserver && !Shopify.designMode) {
      testimonialsCarouselObserver.observe(carousel);
    } else {
      theme.testimonialsCarouselInit(carousel);
    }
  });
};

theme.headerStickyClass = function() {
  // get the sticky element
  const stickyHeaderElm = document.querySelector('.js-section__header');

  const headerStickyObserver = new IntersectionObserver(
    ([e]) => document.body.classList.toggle('header-stuck', e.intersectionRatio < 1), {
      threshold: [1]
    }
  );

  //check if header is sticky
  if ($('.js-header').data("sticky-header")) {
    headerStickyObserver.observe(stickyHeaderElm);
  }
};

theme.headerScrollUp = function headerScrollControl() {
  function hasScrolled() {
    var st = $(this).scrollTop();

    // Make sure to scroll more than delta
    if(Math.abs(lastScrollTop - st) <= delta)
      return;

    // If scrolled down and are past the navbar, add class .nav-up.
    // This is necessary so you never see what is "behind" the navbar.
    if (st > lastScrollTop && st > navbarHeight){// Scroll Down
      $(body).removeClass('header-down').addClass('header-up');
    } else {// Scroll Up
      $(body).removeClass('header-up').addClass('header-down');
    }
    lastScrollTop = st;
  }

  if ($(".js-header").hasClass("js-header-scroll")) {
    // Hide Header on on scroll down
    var didScroll;
    var lastScrollTop = 0;
    var delta = 5;
    var navbarHeight = $('.js-header').outerHeight() + 50;

    $(window).on('scroll', function(event){
      didScroll = true;
    });

    setInterval(function() {
      if ($(".js-header").hasClass("js-header-scroll")) {
        if (didScroll) {
          hasScrolled();
          didScroll = false;
        }
      }
    }, 250);
  }
};

//animated scroll to div ID
theme.scrollToDiv = function() {
  $(".js-scroll-id").on('click', function(e) {
    var thisId = $(this).attr("href");

    //check for the offset
    if ($(".js-header").hasClass("js-header-sticky")) {
      scrollOffset = $(".js-header").outerHeight() + 18;
    } else {
      scrollOffset = 18;
    }

    //scroll
    $("html,body").animate(
      {
      scrollTop: $(thisId).offset().top - scrollOffset
      },
      800
    );

    return false;
  });
};

class Accordion {
  constructor(el) {
    this.el = el;
    this.summary = el.querySelector('summary');
    this.content = el.querySelector('details-content');

    this.animation = null;
    this.isClosing = false;
    this.isExpanding = false;

    this.summary.addEventListener('click', (e) => this.onClick(e));
  }

  onClick(e) {
    e.preventDefault();
    if (this.isClosing || !this.el.open) {
      this.open();
    } else if (this.isExpanding || this.el.open) {
      this.shrink();
    }
  }

  shrink() {
    this.isClosing = true;
    this.el.classList.add('is-closing');
    // Add an overflow on the <details> to avoid content overflowing
    this.el.style.overflow = 'hidden';
    // Store the current height of the element
    const startHeight = `${this.el.offsetHeight}px`;
    // Calculate the height of the summary
    const endHeight = `${this.summary.offsetHeight}px`;

    // If there is already an animation running
    if (this.animation) {
      // Cancel the current animation
      this.animation.cancel();
    }

    // Start a WAAPI animation
    this.animation = this.el.animate({
      // Set the keyframes from the startHeight to endHeight
      height: [startHeight, endHeight]
    }, {
      duration: 300,
      easing: 'ease-in-out'
    });

    // When the animation is complete, call onAnimationFinish()
    this.animation.onfinish = () => this.onAnimationFinish(false);
    // If the animation is cancelled, isClosing variable is set to false
    this.animation.oncancel = () => {
      this.isClosing = false;
      this.el.classList.remove('is-closing');
    };
  }

  open() {
    // Add an overflow on the <details> to avoid content overflowing
    this.el.style.overflow = 'hidden';
    // Apply a fixed height on the element
    this.el.style.height = `${this.el.offsetHeight}px`;

    // Force the [open] attribute on the details element
    this.el.open = true;
    // Wait for the next frame to call the expand function
    window.requestAnimationFrame(() => this.expand());
  }

  expand() {
    // Set the element as "being expanded"
    this.isExpanding = true;
    this.el.classList.add('is-opening');
    // Get the current fixed height of the element
    const startHeight = `${this.el.offsetHeight}px`;
    // Calculate the open height of the element (summary height + content height)
    const endHeight = `${this.summary.offsetHeight + this.content.offsetHeight}px`;

    // If there is already an animation running
    if (this.animation) {
      // Cancel the current animation
      this.animation.cancel();
    }

    // Start a WAAPI animation
    this.animation = this.el.animate({
      // Set the keyframes from the startHeight to endHeight
      height: [startHeight, endHeight]
    }, {
      duration: 300,
      easing: 'ease-in-out'
    });
    // When the animation is complete, call onAnimationFinish()
    this.animation.onfinish = () => this.onAnimationFinish(true);
    // If the animation is cancelled, isExpanding variable is set to false
    this.animation.oncancel = () => {
      this.isExpanding = false;
      this.el.classList.remove('is-opening');
    };
  }

  onAnimationFinish(open) {
    this.el.open = open;
    this.animation = null;
    this.isClosing = false;
    this.el.classList.remove('is-closing');
    this.isExpanding = false;
    this.el.classList.remove('is-opening');
    this.el.style.height = '';
    this.el.style.overflow = '';
  }
}

class AccordionGroup extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.details = this.querySelectorAll('details');
    this.accordions = {};

    this.details.forEach((el) => {
      this.accordions[el.id] = new Accordion(el);
    });

    window.addEventListener('DOMContentLoaded', () => {
      const outsideTriggers = document.querySelectorAll(
        Array.from(this.details).map((el) => `a[href="#${el.id}"]`).toString()
      );

      outsideTriggers.forEach((trigger) => {
        trigger.addEventListener('click', (e) => {
          e.preventDefault();

          this.open(trigger.getAttribute('href').slice(1));

          const elementToScrollTo = document.querySelector(trigger.getAttribute('href'));

          if (elementToScrollTo) {
            let scrollOffset = 24;

            //check if sticky header and add to offset
            const header = document.querySelector('.js-header');
            if (header && header.classList.contains('js-header-sticky')) {
              scrollOffset += header.offsetHeight;
            }

            //check if announcement present and add to offset
            const announcement = document.querySelector('.js-section__announcement');
            if (announcement) {
              scrollOffset += announcement.offsetHeight;
            }

            window.scrollTo({
              top: elementToScrollTo.offsetTop + scrollOffset,
              behavior: 'smooth'
            });
          }

        });
      });
    });
  }

  open(id) {
    if (this.accordions[id]) {
      this.accordions[id].open();
    }
  }

  close(id) {
    if (this.accordions[id]) {
      this.accordions[id].shrink();
    }
  }
}
customElements.define('accordion-group', AccordionGroup);

//localize popup toggle
theme.localizeToggle = function() {
  var box = $(".js-localize-box");
  var trigger = $(".js-localize-trigger");
  var item = $(".js-localize-item");
  var activeClass = "js-active";

  item.on('click', function() {
    var value = $(this).data('value');

    $(this).parents('.js-localize-wrapper').find("[data-disclosure-input]").val(value);
    $(this).parents('form').trigger('submit');

    return false;
  });

  trigger.on('click', function() {

  var thisTarget = $(this).parents('.js-localize-wrapper').find(box);

  if ($(this).hasClass(activeClass)) {
    $(this).removeClass(activeClass).attr("aria-expanded", "false");
    $(thisTarget).removeClass(activeClass);
  } else {
    box.removeClass(activeClass);
      trigger.removeClass(activeClass).attr("aria-expanded", "false");

    $(thisTarget).addClass(activeClass);
    $(this).addClass(activeClass).attr("aria-expanded", "true");
  }

  return false;
  });

  //basic accessibility for keyboard
  box
    .on('focusin', function() {
      $(this).addClass(activeClass);
      $(this).parents('.js-localize-wrapper').find(trigger).addClass(activeClass).attr("aria-expanded", "true");
    })
    .on('focusout', function() {
      $(this).removeClass(activeClass);
      $(this).parents('.js-localize-wrapper').find(trigger).removeClass(activeClass).attr("aria-expanded", "false");
    });

  //click escape to close box and reset focus to trigger
  $(document).keyup(function(e) {
    if (e.key === "Escape" && box.hasClass('js-active')) {
      box.removeClass(activeClass);
      trigger.filter('.js-active')[0].focus();
      trigger.removeClass(activeClass).attr("aria-expanded", "false");
    }
  });

  //click outside elem to hide functions
  $(document).on('click', function(e) {
    if (!box.is(e.target) && box.has(e.target).length === 0) {
      box.removeClass(activeClass);
      trigger.removeClass(activeClass).attr("aria-expanded", "false");
    }
  });
};

//header nav functions
theme.headerNav = function() {
  // var link = $(".js-header-sub-link");
  // var tLink = $(".js-header-sub-t-link");
  var linkA = $(".js-header-sub-link-a");
  // var tLinkA = $(".js-header-sub-t-a");
  var localizeWrapperClass = '.js-localize-wrapper';
  var activeClass = "js-active";

  //add class to body when first level dropdown is hovered (active)
  //used for transparent header ipad no hover bug fix
  // $('.js-header-sub-link').hover(
  //   function() {
  //     $(body).addClass('header-sub-link-expanded');
  //   }, function() {
  //     $(body).removeClass('header-sub-link-expanded');
  //   }
  // );

  //nav accessibility for keyboard
  // link.not(localizeWrapperClass)
  //   .on('focusin', function() {
  //     $(this).addClass(activeClass);
  //     $(this).find(linkA).attr("aria-expanded", "true");
  //   });

  $(localizeWrapperClass).on('click', function() {
    $(this).addClass(activeClass);
    $(this).find(linkA).attr("aria-expanded", "true");

    return false;
  });
  //click escape to close open dropdown and reset focus to its trigger
  $(document).keyup(function(e) {
    if (e.key === "Escape" && $(localizeWrapperClass).hasClass(activeClass)) {
      $(localizeWrapperClass)
        .removeClass(activeClass)
        .find('.js-header-sub-link-a.js-active')
        .removeClass(activeClass)
        .attr("aria-expanded", "false")
        .focus();
    }
  });

  $('.js-nav-sub').on('focusin', function() {
      $(this.parentElement).addClass(activeClass);
      $(this).parent().find(linkA).addClass(activeClass).attr("aria-expanded", "true");
    })
    .on('focusout', function() {
      $(this.parentElement).removeClass(activeClass);
      $(this).parent().find(linkA).removeClass(activeClass).attr("aria-expanded", "false");
    });

  // tLink.on('focusin', function() {
  //   tLink.removeClass(activeClass);
  //   tLinkA.attr("aria-expanded", "false");
  //   $(this).addClass(activeClass);
  //   $(this).find(tLinkA).attr("aria-expanded", "true");
  // });
  // link.on('mouseout', function() {
  //   $(this).removeClass(activeClass);
  // });
  // tLink.on('mouseout', function() {
  //   $(this).removeClass(activeClass);
  // });

  //disable parent links
  // $(".header--parent-disabled .js-header-sub-link-a, .header--parent-disabled .js-header-sub-t-a").on('click', function(e) {
  //   e.preventDefault();
  // });

  //calculate if third sub nav should appear on right ON MOUSEOVER
  // tLink.on("mouseover focusin", function() {
  //   var subNavT = $(this).find(".js-nav-sub-t");
  //   //calc sub nav offset compared to window width
  //   var ofsNo = winWidth - (subNavT.offset().left + subNavT.width());
  //   //place subnav
  //   if (ofsNo < 1) {
  //     subNavT.css("right", "179px");
  //     subNavT.css("left", "auto");
  //   }
  // });
};

class DrawerMenu extends HTMLElement {
  constructor() {
    super();

    this.bannerHeightObserver = null;

    this.setCurrentPanelId();
    this.bindEvents();
  }

  setCurrentPanelId() {
    const currentPanel = Array.from(this.querySelectorAll('details[open]')).pop();

    this.currentPanelId = currentPanel ? currentPanel.id : null;
  }

  bindEvents() {
    this.querySelectorAll('summary').forEach((summary) =>
      summary.addEventListener('click', this.onSummaryClick.bind(this)),
    );
    this.querySelectorAll('button').forEach((button) =>
      button.addEventListener('click', this.onCloseButtonClick.bind(this)),
    );
  }

  enableBannerHeightControl(banner) {
    if (!banner) return;

    this.bannerHeightObserver = new ResizeObserver(debounce((entries) => {
      entries.forEach((entry) => {
        entry.target.style.setProperty('--banner-height', `${Math.round(entry.contentRect.height)}px`);
      });
    }, 10));

    this.bannerHeightObserver.observe(banner);
  }

  disableBannerHeightControl() {
    if (!this.bannerHeightObserver) return;
    this.bannerHeightObserver.disconnect();
    this.bannerHeightObserver = null;
  }

  onSummaryClick(event) {
    const summaryElement = event.currentTarget;
    const detailsElement = summaryElement.parentNode;
    const isOpen = detailsElement.hasAttribute('open');

    if (detailsElement === this.mainDetailsToggle) {
      if (isOpen) event.preventDefault();
      if (isOpen) {
        this.closeMenuDrawer(event, summaryElement);
      } else {
        this.openMenuDrawer(summaryElement);
      }
    } else {
      setTimeout(() => {
        this.currentPanelId = this.openPanel(detailsElement);
      }, 100);
    }
  }

  onCloseButtonClick(event) {
    const detailsElement = event.currentTarget.closest('details');
    this.closeSubmenu(detailsElement);
  }

  closeSubmenu(detailsElement, animate = true) {
    detailsElement.classList.remove('is-opening');
    detailsElement.querySelector('summary').setAttribute('aria-expanded', false);

    // Banner logic
    const openParent = detailsElement.parentElement.closest('details[open]');
    const parentBanner = openParent ? document.getElementById(`${openParent.id}-banner`) : null;

    this.disableBannerHeightControl();
    if (!parentBanner) {
      detailsElement.closest('.mobile-draw').classList.remove('has-banner');
    } else {
      detailsElement.closest('.mobile-draw').classList.add('has-banner');
      this.enableBannerHeightControl(parentBanner);
    }

    removeTrapFocus(detailsElement.querySelector('summary'));
    if (animate) {
      this.closeAnimation(detailsElement);
    } else {
      detailsElement.removeAttribute('open');
      if (detailsElement.closest('details[open]')) {
        trapFocus(
          detailsElement.closest('details[open]'),
          detailsElement.querySelector('summary'),
        );
      }
    }

    this.currentPanelId = openParent ? openParent.id : null;
  }

  closeAnimation(detailsElement) {
    let animationStart;

    const handleAnimation = (time) => {
      if (animationStart === undefined) {
        animationStart = time;
      }

      const elapsedTime = time - animationStart;

      if (elapsedTime < 400) {
        window.requestAnimationFrame(handleAnimation);
      } else {
        detailsElement.removeAttribute('open');
        if (detailsElement.closest('details[open]')) {
          trapFocus(
            detailsElement.closest('details[open]'),
            detailsElement.querySelector('summary'),
          );
        }
      }
    };

    window.requestAnimationFrame(handleAnimation);
  }

  openMenuPanelById(id, animate = true, focus = true) {
    const detailsElement = document.getElementById(id);

    if (!detailsElement) return;

    this.closeAllOpenPanels();

    const parentPanel = detailsElement.parentElement.closest('details');

    if (parentPanel) {
      parentPanel.setAttribute('open', '');
      if (animate) {
        setTimeout(() => {
          this.openPanel(parentPanel, false);
        }, 100);
      } else {
        this.openPanel(parentPanel, false);
      }
    }

    detailsElement.setAttribute('open', '');
    if (animate) {
      setTimeout(() => {
        this.currentPanelId = this.openPanel(detailsElement, focus);
      }, 100);
    } else {
      this.currentPanelId = this.openPanel(detailsElement, focus);
    }
  }

  openPanel(detailsElement, focus = true) {
    const summaryElement = detailsElement.querySelector('summary');
    const banner = document.getElementById(`${detailsElement.id}-banner`);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    function addTrapFocus() {
      trapFocus(
        summaryElement.nextElementSibling,
        detailsElement.querySelector('button'),
      );
      summaryElement.nextElementSibling.removeEventListener(
        'transitionend',
        addTrapFocus,
      );
    }

    this.disableBannerHeightControl();
    if (banner) {
      this.enableBannerHeightControl(banner);
      detailsElement.closest('.mobile-draw').classList.add('has-banner');
    } else {
      detailsElement.closest('.mobile-draw').classList.remove('has-banner');
    }
    detailsElement.classList.add('is-opening');
    summaryElement.setAttribute('aria-expanded', true);

    if (focus) {
      if (!reducedMotion || reducedMotion.matches) {
        addTrapFocus();
      } else {
        summaryElement.nextElementSibling.addEventListener('transitionend', addTrapFocus);
      }
    }

    return detailsElement.id;
  }

  closeAllOpenPanels() {
    const currentlyOpenPanels = this.querySelectorAll('details[open]');

    currentlyOpenPanels.forEach((panel) => {
      this.closeSubmenu(panel, false);
    });
  }
}

customElements.define('drawer-menu', DrawerMenu);

theme.homeFeaturedCollection = function() {
  var featuredCollectionCarousels = document.querySelectorAll('.featured-collection--carousel');
  featuredCollectionCarousels.forEach(function(container) {
    initiateScroll(container.querySelectorAll('.featured-collection__nav--btn'), container.querySelector('.grid-layout'));
  });
};

theme.sectionMultiColumn = function() {
  var multiColumnCarousels = document.querySelectorAll('.multi-column--carousel');
  multiColumnCarousels.forEach(function(container) {
    initiateScroll(container.querySelectorAll('.multi-column__nav--btn'), container.querySelector('.grid-layout'));
  });
};

//toggle active class on target div
theme.triggerActive = function() {
  var trigger = $(".js-toggle-trigger");
  var activeClass = "js-active";

  trigger.on('click', function(e) {
    var thisTarget = $(this).attr("href");
    if ($(this).hasClass(activeClass)) {
      $(this).removeClass(activeClass);
      $(thisTarget).removeClass(activeClass);
      //accessibility
      $(this)
      .parent()
      .attr("aria-expanded", "false");
    } else {
      $(this).addClass(activeClass);
      $(thisTarget).addClass(activeClass);
      //accessibility
      $(this)
      .parent()
      .attr("aria-expanded", "true");
    }
    e.preventDefault();
  });
};

//age checker popup
theme.ageCheckerCookie = function() {
  var ageCookie = "age-checked";

  if ($(".js-age-draw").data("age-check-enabled")) {
  if (typeof Cookies != "undefined") {
    if (Cookies(ageCookie) !== "1") {
    theme.mfpOpen("age");
    }
  }
  }

  $(".js-age-close").on('click', function(e) {
    Cookies(ageCookie, "1", { expires: 14, path: "/" });
    $.magnificPopup.close();

    e.preventDefault();
  });
};

//promo popup
theme.promoPopCookie = function() {
  var promoCookie = "promo-showed";
  var promoDelay = $(".js-promo-pop").data("promo-delay");
  var promoExpiry = $(".js-promo-pop").data("promo-expiry");

  if ($(".js-promo-pop").data("promo-enabled")) {
    if (typeof Cookies != "undefined") {
      if (Cookies(promoCookie) !== "1") {
        setTimeout(function() {
          theme.promoPop("open");
        }, promoDelay);
      }
    }
  }

  $(".js-promo-pop-close").on('click', function(e) {
    Cookies(promoCookie, "1", { expires: promoExpiry, path: "/" });
    theme.promoPop("close");

    e.preventDefault();
  });
};

//magnific popup functions
theme.mfpOpen = function(popup, block) {
  var closeBtn =
  '<button title="Close (Esc)" type="button" class="mfp-close mfp-close--custom js-close-mfp" aria-label="close"><i class="icon icon--close-l"></i></button>';

  switch (popup) {
  case "cart":
    if (theme.cart_ajax) {
      if (theme.cart_type == "modal") {
        $.magnificPopup.open({
        items: {
        src: ".js-cart-draw"
        },
        type: "inline",
        mainClass: "mfp-draw mfp-draw--right",
        fixedContentPos: true,
        midClick: true,
        closeMarkup: closeBtn,
        removalDelay: 200
      });
      } else {
        $.magnificPopup.open({
        items: {
        src: ".js-cart-draw"
        },
        type: "inline",
        alignTop: true,
        mainClass: "mfp-notification",
        fixedContentPos: false,
        midClick: true,
        closeMarkup: closeBtn,
        removalDelay: 200,
        closeOnBgClick: false,
        callbacks: {
              open: function(item) {
                var thisPopup = $.magnificPopup.instance;
              //automatic close
                setTimeout(function(){
                  if (thisPopup.isOpen && thisPopup.currItem.src == '.js-cart-draw') {
                       thisPopup.close();
                     }
                }, 4000);
              }
        }
      });
      }
    }
    break;

  case "search":
    $.magnificPopup.open({
    items: {
      src: ".js-search-draw"
    },
    type: "inline",
    mainClass: "mfp-search",
    fixedContentPos: true,
    focus: ".js-search-input",
    closeMarkup: closeBtn,
    removalDelay: 200,
    callbacks: {
      close: () => {
        const [predictiveSearch] = $.magnificPopup.instance.content.find('predictive-search');
        if (predictiveSearch) {
          predictiveSearch.close();

          const input = predictiveSearch.querySelector('.js-search-input');
          if (input) input.value = '';
        }
      }
    }
    });
    break;

  case "product-popup":
    $.magnificPopup.open({
    items: {
      src: ".js-product-popup-draw-" + block
    },
    type: "inline",
    mainClass: "mfp-medium",
    fixedContentPos: true,
    closeMarkup: closeBtn,
    removalDelay: 200
    });
    break;

  case "announcement-popup":
    $.magnificPopup.open({
    items: {
      src: ".js-announcement-popup-draw-" + block
    },
    callbacks: {
      open: function() {
        const announcementSlide = document.getElementById(block);
        if (announcementSlide) {
          const announcementBar = announcementSlide.closest('announcement-bar');
          if (announcementBar) {
            announcementBar.setAttribute('popup-open', '');
            if (announcementBar.autoplay) announcementBar.stopAutoplay();
          }
        }
      },
      close: function() {
        const announcementSlide = document.getElementById(block);
        if (announcementSlide) {
          const announcementBar = announcementSlide.closest('announcement-bar');
          if (announcementBar) {
            announcementBar.removeAttribute('popup-open');
            if (announcementBar.autoplay) announcementBar.startAutoplay();
          }
        }
      }
    },
    type: "inline",
    mainClass: "mfp-medium",
    fixedContentPos: true,
    closeMarkup: closeBtn,
    removalDelay: 200
    });
    break;

  case "age":
    $.magnificPopup.open({
    items: {
      src: ".js-age-draw"
    },
    type: "inline",
    mainClass: "mfp-dark",
    fixedContentPos: true,
    modal: true,
    showCloseBtn: false,
    removalDelay: 200
    });
    break;

  case "menu-draw":
    $.magnificPopup.open({
    items: {
      src: ".js-menu-draw"
    },
    callbacks: {
      close: function() {
        const drawer = document.querySelector('.js-menu-draw');

        if (drawer) {
          const menu = drawer.querySelector('drawer-menu');

          if (menu) {
            menu.closeAllOpenPanels();
          }
        }
      }
    },
    type: "inline",
    mainClass: "mfp-draw",
    fixedContentPos: true,
    closeMarkup: closeBtn,
    removalDelay: 200
    });
    break;

  case "store-availability-draw":
    $.magnificPopup.open({
    items: {
      src: ".js-store-availability-draw"
    },
    type: "inline",
    mainClass: "mfp-draw mfp-draw--right",
    fixedContentPos: true,
    closeMarkup: closeBtn,
    removalDelay: 200
    });
    break;

  case "collection-draw":
    $.magnificPopup.open({
      items: {
        src: ".js-collection-draw"
      },
      callbacks: {
        resize: function() {
          if (winWidth >= theme.tabletBrkp) {
            $.magnificPopup.close();
          }
        },
        open: function() {
          document.body.classList.add('js-collection-draw-open');
        },
        close: function() {
          document.body.classList.remove('js-collection-draw-open');
        }
      },
      type: "inline",
      mainClass: "mfp-draw",
      fixedContentPos: true,
      closeMarkup: closeBtn,
      removalDelay: 200
    });
    break;

  case "quick-shop":
    $.magnificPopup.open({
      items: {
        src: block
      },
      callbacks: {
        resize: function() {
          if (winWidth < theme.mobileBrkp) {
            $.magnificPopup.close();
          }
        },
        afterClose: () => {
          block.dispatchEvent(new CustomEvent('closed.quickShop'));
        }
      },
      type: "inline",
      mainClass: "mfp-draw mfp-draw--right mfp-quick-shop",
      fixedContentPos: true,
      closeMarkup: closeBtn,
      removalDelay: 200,
      disableOn: theme.mobileBrkp,
      key: 'quick-shop',
    });
    break;
  }
};

class RecentSearches extends HTMLElement {
  constructor() {
    super();

    this.update();
  }

  update() {
    const recentSearchesStoredString = localStorage.getItem('recentSearches');

    if (recentSearchesStoredString) {
      const ul = this.querySelector('ul');
      const recentSearchesStored = JSON.parse(recentSearchesStoredString);

      if (recentSearchesStored.length > 0) {
        this.parentElement.classList.add('has-recent-searches');
        ul.innerHTML = recentSearchesStored.reverse().reduce((innerHTML, item) => {
          return `
            ${innerHTML}
            <li class="search__nav-item">
              <a href="${item.uri}" class="search__nav-link">${item.query}</a>
            </li>
          `;
        }, '');
        this.removeAttribute('hidden');
      }
    }
  }
}
customElements.define('recent-searches', RecentSearches);

class SearchForm extends HTMLElement {
  constructor() {
    super();

    this.form = this.querySelector('form');
  }

  connectedCallback() {
    if (this.hasAttribute('add-recent-search-on-load')) this.addFormStateToRecentSearches();
  }

  addRecentSearch(query, uri) {
    if (!query || !uri) return;

    const getUniqueListBy = (arr, key) =>
      [...new Map(arr.map(item => [item[key], item])).values()];

    let recentSearches = [
      {
        query,
        uri
      }
    ];

    const recentSearchesStoredString = localStorage.getItem('recentSearches');

    if (recentSearchesStoredString) {
      const recentSearchesStored = JSON.parse(recentSearchesStoredString);
      const combinedSearches = [
        ...recentSearchesStored,
        ...recentSearches
      ];

      recentSearches = getUniqueListBy(combinedSearches.reverse(), 'query').reverse();

      if (recentSearches.length > 5) {
        recentSearches = recentSearches.slice(-5);
      }
    }

    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));

    document.querySelectorAll('recent-searches').forEach((el) => el.update());
  }

  addFormStateToRecentSearches() {
    if (!this.form) return;

    const form = new FormData(this.form);
    const search = new URLSearchParams(form);

    const formAction = new URL(`${location.origin}${this.form.getAttribute('action')}`);
    const formActionOrigin = location.origin;
    const formActionPath = formAction.pathname;
    const formActionSearch = formAction.searchParams;

    const combinedSearch = new URLSearchParams({
      ...Object.fromEntries(formActionSearch),
      ...Object.fromEntries(search)
    });

    this.addRecentSearch(form.get('q'), `${formActionOrigin}${formActionPath}?${combinedSearch.toString()}`);
  }
}
customElements.define('search-form', SearchForm);

// =======================
// Collection form filters
// =======================
class DynamicProductSearch extends HTMLElement {
  constructor() {
    super();

    this.abortController = null;

    this.forms = [
      this.querySelector('.js-search-form'),
      this.querySelector('.js-sort-form'),
      this.querySelector('.js-filters-form')
    ].filter(f => f);

    this.section = this.closest('.section');

    this.updateLoading();

    // Remove query input from filters (otherwise duplicate)
    if (this.querySelector('.js-search-form') && this.querySelector('.js-filters-form')) {
      this.querySelector('.js-filters-form input[name="q"]').remove();
    }

    this.forms.forEach((form) => {
      // Set up onChange events, submit if
      // 'data-submit-on-change' is present
      if (form.dataset.submitOnChange === 'true') {
        form.addEventListener('change', () => {
          form.requestSubmit();
        });
      }

      form.addEventListener('submit', (e) => {
        e.preventDefault();

        if (this.abortController) this.abortController.abort();

        let query = '';
        if (e.target.classList.contains('js-search-form')) {
          const paramsToKeep = ['type', 'q', 'sort_by'];
          query = this.forms.reduce((qs, f) => {
            const thisFormData = new FormData(f);

            for (const [paramName] of thisFormData.entries()) {
              if (!paramsToKeep.includes(paramName)) thisFormData.delete(paramName);
            }

            const thisQueryString = new URLSearchParams(thisFormData).toString();

            return `${qs}${thisQueryString ? `${qs ? '&' : ''}${thisQueryString}` : ''}`;
          }, '');

        } else {
          query = this.forms.reduce((qs, f) => {
            const thisFormData = new FormData(f);
            const thisQueryString = new URLSearchParams(thisFormData).toString();

            return `${qs}${thisQueryString ? `${qs ? '&' : ''}${thisQueryString}` : ''}`;
          }, '');
        }

        this.renderCollection({ query });
      });
    });

    this.boundLinksHandler = this.linksHandler.bind(this);
    this.filtersControl();
    this.paginationControl();

    this.boundPopStateHandler = this.popStateListener.bind(this);
    window.addEventListener('popstate', this.boundPopStateHandler);
  }

  popStateListener() {
    const query = window.location.search.slice(1);
    this.renderCollection({
      updateURL: false,
      query
    });
    window.removeEventListener('popstate', this.boundPopStateHandler);
  }

  linksHandler(e, scrollUp = false) {
    e.preventDefault();
    if (!e.target.getAttribute('href') && !e.target.dataset.url) return;

    const url = e.target.getAttribute('href') || e.target.dataset.url;
    const query = url.split('?').length > 0 ? url.split('?')[1] : '';

    this.renderCollection({ query, scrollUp });
  }

  filtersControl() {
    const filters = this.querySelectorAll('.js-filter-trigger');

    filters.forEach((filter) => {
      filter.addEventListener('click', this.boundLinksHandler);
    });
  }

  paginationControl() {
    const paginationLinks = this.querySelectorAll('.pagination a');

    paginationLinks.forEach((paginationLink) => {
      paginationLink.addEventListener('click', (e) => {
        this.boundLinksHandler(e, true);
      });
    });
  }

  renderError(e = theme.t.error_products) {
    if (this.previousElementSibling &&
      this.previousElementSibling.classList.contains('error')) {
        this.previousElementSibling.remove();
    }
    const error = document.createElement('div');
    error.classList.add('error');
    error.innerHTML = e;
    this.section.prepend(error);
  }

  renderCollection(params) {
    const {
      query,
      updateURL,
      scrollUp
    } = {
      query: '',
      updateURL: true,
      scrollUp: false,
      ...params
    };

    const currentFocusElementId = document.activeElement && document.activeElement.getAttribute('id');

    const sectionClass = `.section--${this.dataset.section}`;
    this.abortController = new AbortController();

    this.updateLoading(true);
    fetch(`${this.dataset.url}?${query}&section_id=${this.dataset.section}`, {
      signal: this.abortController.signal
    })
      .then((response) => {
        if(response.ok) return response.text();

        throw new Error(theme.t.error_products);
      })
      .then((responseText) => {
        let sidebarContentOffset = 0;
        if (document.body.classList.contains('js-collection-draw-open')) {
          const [content] = $.magnificPopup.instance.content.find('.collection-sidebar__wrapper');
          if (content) {
            sidebarContentOffset = content.scrollTop;
          }
        }

        const html = new DOMParser().parseFromString(responseText, 'text/html');

        const destination = document.querySelector(sectionClass);
        const source = html.querySelector(sectionClass);

        if (source && destination) destination.innerHTML = source.innerHTML;

        if (document.body.classList.contains('js-collection-draw-open')) {
          $.magnificPopup.open({
            items: {
              src: ".js-collection-draw"
            }
          });
          if (sidebarContentOffset !== 0) {
            const [content] = $.magnificPopup.instance.content.find('.collection-sidebar__wrapper');
            if (content) {
              content.scrollTop = sidebarContentOffset;
            }
          }
        }

        if (scrollUp) this.scrollUp();

        const newPageTitle = document.querySelector(`${sectionClass} dynamic-product-search`).dataset.pageTitle;

        if (updateURL) this.updateURL(query, newPageTitle);

        // Update document title
        document.title = newPageTitle;

        if (window.ajaxCart) {
          const forms = document.querySelectorAll(`${sectionClass} form[action^="/cart/add"]`);

          Array.from(forms).forEach((form) => {
            window.ajaxCart.initForm(form);
          });
        }

        if (this.dataset.quickShopDynamicCheckout === 'true' && window.Shopify && window.Shopify.PaymentButton) window.Shopify.PaymentButton.init();

        if (document.body.dataset.animLoad === 'true') {
          window.sr.reveal(`
            ${sectionClass} .collection__filters-active,
            ${sectionClass} .collection-pagination,
            ${sectionClass} .section__title,
            ${sectionClass} .search-page__form,
            ${sectionClass} .search-page__info
          `, { distance: 0, delay: 50 });
          window.sr.reveal(`${sectionClass} .product-card-top, ${sectionClass} .search-grid-item`, {
            interval: theme.intervalValue,
            delay: 0
          });
        }

        const currentlyFocusedElement = document.getElementById(currentFocusElementId);
        if (currentlyFocusedElement) {
          currentlyFocusedElement.focus();
        }
      })
      .catch((error) => {
        if (error.name && error.name === 'AbortError') return;
        this.updateLoading(false);
        this.renderError(error);
        if (document.body.classList.contains('js-collection-draw-open')) {
          $.magnificPopup.close();
        }
        this.scrollUp();
      });
  }

  scrollUp() {
    const top = this.section.getBoundingClientRect().top;
    window.scrollBy({
      behavior: 'smooth',
      top
    });
  }

  updateLoading(isLoading = false) {
    this.loading = isLoading;
    if (isLoading) {
      this.section.classList.add('is-loading');
    } else {
      this.section.classList.remove('is-loading');
    }
  }

  updateURL(query, title = '') {
    if (this.dataset.updateUrl === 'false') return;
    window.history.pushState({ }, title, `${this.dataset.url}${query ? `?${query}` : ''}`);
    window.removeEventListener('popstate', this.boundPopStateHandler);
  }
}
customElements.define('dynamic-product-search', DynamicProductSearch);

class PriceRange extends HTMLElement {
  constructor() {
    super();

    this.rangeS = this.querySelectorAll('.price-range__input');
    this.numberS = this.querySelectorAll('.price-range__number');

    this.init();
  }

  init() {
    this.rangeS.forEach((el) => {
      el.oninput = () => {
        let slide1 = parseFloat(this.rangeS[0].value);
        let slide2 = parseFloat(this.rangeS[1].value);

        if (slide1 > slide2) {
          [slide1, slide2] = [slide2, slide1];
        }

        this.numberS[0].value = slide1;
        this.numberS[1].value = slide2;
      };
    });

    this.numberS.forEach((el) => {
      el.oninput = () => {
        let number1 = parseFloat(this.numberS[0].value);
        let number2 = parseFloat(this.numberS[1].value);

        if (number1 > number2) {
          let tmp = number1;
          this.numberS[0].value = number2;
          this.numberS[1].value = tmp;
        }

        this.rangeS[0].value = number1;
        this.rangeS[1].value = number2;
      };
    });
  }
}
customElements.define('price-range', PriceRange);

theme.magnificVideo = function() {
  $(".js-pop-video").magnificPopup({
  type: "iframe",
  mainClass: "mfp-medium mfp-close-corner",
  removalDelay: 200,
  closeMarkup:
    '<button title="Close (Esc)" type="button" class="mfp-close mfp-close--custom js-close-mfp"><i class="icon icon--close-l"></i></button>'
  });
};

theme.promoPop = function(action) {
  var popup = $(".js-promo-pop");
  var activeClass = "js-active";

  if (action == "open") {
  popup.addClass(activeClass);
  } else if (action == "close") {
  popup.removeClass(activeClass);
  }
};

theme.cartCheckbox = function() {
  $(document).on('click', '.js-cart-checkout-validate', function() {
    if ($('.js-cart-terms-input').is(':checked')) {
      $(this).trigger('submit');
    } else {
      var errorBox = $(this).parents('form').find('.js-cart-terms-error');
      errorBox.addClass('js-active');
      return false;
    }
  });
  $(document).on('change', '.js-cart-terms-input', function() {
        $('.js-cart-terms-error').removeClass('js-active');
    });
};

//functions to initiate ajax cart for the first time
theme.runAjaxCart = function() {
  Handlebars.registerHelper('ifnoteq', function (a, b, options) {
    if (a != b) { return options.fn(this); }
    return options.inverse(this);
  });

  Handlebars.registerHelper('iffirstnoteq', function (a, b, options) {
    if (a[0] != b) { return options.fn(this); }
    return options.inverse(this);
  });

  theme.ajaxCartInit();
  ajaxCart.load();
};

//product page recommendations
theme.productRecommendations = function() {
  // Look for an element with class 'js-product-recommendations'
  var productRecommendationsSection = document.querySelector('.js-product-recommendations');
  if (productRecommendationsSection === null) {return;}
  // Read product id from data attribute
  var productId = productRecommendationsSection.dataset.productId;
  // Read limit from data attribute
  var limit = productRecommendationsSection.dataset.limit;
  // Build request URL
  var requestUrl = productRecommendationsSection.dataset.url;
  // Create request and submit it using Ajax
  var request = new XMLHttpRequest();
  request.open('GET', requestUrl);
  request.onload = function() {
  if (request.status >= 200 && request.status < 300) {
    var container = document.createElement('div');
    container.innerHTML = request.response;
    productRecommendationsSection.parentElement.innerHTML = container.querySelector('.js-product-recommendations').innerHTML;

    //run ajax cart functions
    theme.runAjaxCart();

    // dynamic - dynamic checkout buttons
    if (window.Shopify && Shopify.PaymentButton) {
        Shopify.PaymentButton.init();
      }

    //review stars
    if (window.SPR) {
      window.SPR.initDomEls();
      window.SPR.loadBadges();
    }

    //reset scrolling animations
    if ($("body").data("anim-load")) {
      if (typeof sr !== 'undefined') {
        sr.reveal('.section--recommended-products .product-card-top', { interval: theme.intervalValue });
        sr.reveal('.section--recommended-products .section__title', { distance: "5px" });
      }
    }

    var productRecommendationsCarousels = document.querySelectorAll('.recommended-products--carousel');

    productRecommendationsCarousels.forEach(function(container) {
      initiateScroll(document.querySelectorAll('.recommended-products__nav--btn'), container.querySelector('.grid-layout'));
    });
  }
  };
  request.send();
};

// ======================
// Carousel - Scroll Snap
// ======================
function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
var easingOutQuint = function easingOutQuint(x, t, b, c, d) {
  return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
};
function smoothScrollPolyfill(node, key, target) {
  var startTime = Date.now();
  var offset = node[key];
  var gap = target - offset;
  var duration = 5000;
  var interrupt = false;
  var step = function step() {
    var elapsed = Date.now() - startTime;
    var percentage = elapsed / duration;
    if (interrupt) {
      return;
    }
    if (percentage > 1) {
      cleanup();
      return;
    }
    node[key] = easingOutQuint(0, elapsed, offset, gap, duration);
    requestAnimationFrame(step);
  };
  var cancel = function cancel() {
    interrupt = true;
    cleanup();
  };
  var cleanup = function cleanup() {
    node.removeEventListener('wheel', cancel);
    node.removeEventListener('touchstart', cancel);
  };
  node.addEventListener('wheel', cancel, { passive: true });
  node.addEventListener('touchstart', cancel, { passive: true });
  step();
  return cancel;
}
/*
  Safari doesn’t support smooth scroll behavior and Edge doesn’t support scrollTo() at all.
  Detect support and fall back to a js implementation.
  */
  function testSupportsSmoothScroll() {
    var supports = false;
    try {
      var div = document.createElement('div');
      div.scrollTo({
        top: 0,
        get behavior() {
          supports = true;
          return 'smooth';
        }
      });
  } catch (err) {} // Edge throws an error
  return supports;
}
var hasNativeSmoothScroll = testSupportsSmoothScroll();
function smoothScroll(node, topOrLeft, horizontal) {
  if (hasNativeSmoothScroll) {
    var _node$scrollTo;
    return node.scrollTo((_node$scrollTo = {}, _defineProperty(_node$scrollTo, horizontal ? 'left' : 'top', topOrLeft), _defineProperty(_node$scrollTo, 'behavior', 'smooth'), _node$scrollTo));
  } else {
    return smoothScrollPolyfill(node, horizontal ? 'scrollLeft' : 'scrollTop', topOrLeft);
  }
}

function debounce(f, delay) {
  let timer = 0;
  return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => f.apply(this, args), delay);
  };
}

function setAriaPressed(index, indicators) {
  indicators.forEach(function (indicator, i) {
    if(i===index){
      indicator.setAttribute('aria-pressed', true);
      if(!indicator.classList.contains('active')){
        indicator.classList.add('active');
      }
    } else {
      indicator.setAttribute('aria-pressed', false);
      if(indicator.classList.contains('active')){
        indicator.classList.remove('active');
      }
    }
  });
}
function initiateScroll(indicators, scroller) {
  indicators.forEach(function (indicator, i) {
    indicator.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      setAriaPressed(i, indicators);
      var scrollLeft = Math.floor(scroller.scrollWidth * (i / indicators.length));
      smoothScroll(scroller, scrollLeft, true);
    });
  });
  scroller.addEventListener('scroll', debounce(function () {
    var index = Math.round(scroller.scrollLeft / scroller.scrollWidth * indicators.length);
    setAriaPressed(index, indicators);
  }, 50));
}

// ======================
// Quickbuy modal logic
// ======================
class QuickShop extends HTMLElement {
  constructor() {
    super();
    this.productCard = this.parentElement;
    this.quickShopOpenTrigger = this.productCard.querySelector('.js-quickshop-trigger');
    this.quickShopCloseTrigger = this.querySelector('.quick-shop__close');
    this.quickShopOverlay = this.querySelector('.quick-shop__overlay');
    this.htmlDoc = document.querySelector('html');
    this.isActive = this.classList.contains('active');

    this.quickShopOpenTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      this.show();
    });
    this.quickShopCloseTrigger.addEventListener('click', () => this.hide());

    this.quickShopOverlay.addEventListener('click', () => this.hide());

    this.variantSelector = this.querySelector('variant-selects, variant-radios');

    if (this.variantSelector) {
      this.variantSelector.addEventListener('variants:change', (e) => this.onVariantChange(e));
    }
  }

  show() {
    this.isActive = true;
    if (winWidth >= theme.mobileBrkp) {
      theme.mfpOpen('quick-shop', this);
    } else {
      this.classList.add('active');
      this.htmlDoc.classList.add('scroll-disabled');

      if('ResizeObserver' in window) {
        const observer = new ResizeObserver(debounce((entries, o) => {
          for (let entry of entries) {
            if (entry.target.querySelector('.quick-shop__overlay').getBoundingClientRect().width > theme.mobileBrkp) {
              entry.target.hide();
              o.disconnect();
            }
          }
        }, 100));

        observer.observe(this);
      }
    }
  }

  hide() {
    this.isActive = false;

    if (this.closest('.mfp-content')) {
      $.magnificPopup.close();
    } else {
      this.querySelector('.quick-shop__wrapper').addEventListener('animationend', (e) => {
        if (!e.target.classList.contains('active')) this.dispatchEvent(new CustomEvent('closed.quickShop'));
      }, {once: true});
      this.classList.remove('active');
      this.htmlDoc.classList.remove('scroll-disabled');
    }
  }

  onVariantChange(event) {
    const viewDetailsLink = this.querySelector('.js-view-details');
    const productLink = this.querySelector('.js-product-link');

    if (event.detail.variant && this.dataset.productUrl) {
      const variantId = event.detail.variant.id;
      const newURL = this.dataset.productUrl.includes('?') ? this.dataset.productUrl.concat(`&variant=${variantId}`) : this.dataset.productUrl.concat(`?variant=${variantId}`);
      if (viewDetailsLink) viewDetailsLink.setAttribute('href', newURL);
      if (productLink) productLink.setAttribute('href', newURL);
    }
  }

  setOriginalSectionId() {
    fetch(this.getAttribute('data-product-url'))
    .then((response) => response.text())
    .then((responseText) => {
      const responseHTML = new DOMParser().parseFromString(responseText, 'text/html');
      const productElement = responseHTML.querySelector('section.section--product-single');
      const sectionId = productElement.dataset.sectionId;

      this.querySelectorAll('variant-radios, variant-selects').forEach((el) => {
        el.dataset.originalSection = sectionId;
      });
    });
  }
}
customElements.define('quick-shop', QuickShop);

// ==============
// Image skeleton
// ==============
class ImageSkeleton extends HTMLElement {
  constructor() {
    super();

    this.init();
  }

  init() {
    const image =
      this.previousElementSibling.tagName === 'IMG' ?
        this.previousElementSibling :
        null;

    if (!image) return;

    if (image.hasAttribute('src') && image.complete) {
      this.markAsLoaded();
    } else {
      image.setAttribute('data-loading', '');
      image.addEventListener('load', () => {
        image.removeAttribute('data-loading');
        this.markAsLoaded();
      });
    }
  }

  markAsLoaded() {
    this.setAttribute('loaded', '');
    this.setAttribute('aria-hidden', 'true');
  }
}

customElements.define('image-skeleton', ImageSkeleton);

/*============================================================================
  Run main theme functions
==============================================================================*/
function cartDrawerControl() {
  var cartDrawer = document.querySelector('.js-cart-draw');
  var cartReady = false;

  function waitFor(conditionFunction) {
    const poll = resolve => {
      if(conditionFunction()) resolve();
      else setTimeout(_ => poll(resolve), 100);
    };

    return new Promise(poll);
  }

  function openCartDrawer() {
    waitFor(_ => cartReady === true)
      .then(_ => {
        theme.mfpOpen("cart");
        cartReady = false;
      });
  }

  if (cartDrawer) {
    $(".product-card--trigger-icon quick-shop").on("mouseleave", function() {
      const quickShopElement = this;
      const touchDisabled = !document.querySelector('html').classList.contains('touchevents');

      if (touchDisabled && $(window).width() >= theme.mobileBrkp && quickShopElement.closest('.product-card')) $("body").trigger("mouseOut.productCard", [quickShopElement]);
    });

    $("body").on("beforeAddItem.ajaxCart", function(e, input) {
      const id = $(input.closest('form')).find('[name="id"]').val();

      $("body").attr("data-item-added-to-cart-id", id);
    });

    $("body").on("afterAddItem.ajaxCart", function() {
      $("body").one("afterCartLoad.ajaxCart", function() {
        cartReady = true;
      });
    });

    $("body").on("afterButtonAnimation.ajaxCart mouseOut.productCard", function(e, quickShopElement, addedFromCard) {
      if (quickShopElement) {
        const showCart = document.querySelector('body').dataset.quickShopShowCart === 'true';

        const productId = $(quickShopElement).find('[name="id"]').val();

        if (e.type === 'afterButtonAnimation' && e.namespace === 'ajaxCart') {
          const isStandaloneQuickShopModal = window.getComputedStyle(quickShopElement).getPropertyValue('position') === 'fixed' || quickShopElement.closest('.mfp-content');

          if (isStandaloneQuickShopModal) {
            if (showCart) {
              quickShopElement.addEventListener('closed.quickShop', () => {
                openCartDrawer();
              }, {once: true});
            }

            quickShopElement.hide();
          } else {
            if (showCart) {
              openCartDrawer();
            }
          }
        }

        if (e.type === 'mouseOut' && e.namespace === 'productCard') {
          if (showCart) {
            if (showCart && $("body").attr("data-item-added-to-cart-id") === productId) openCartDrawer();
          }
        }
      } else if (addedFromCard) {
        const showCart = document.querySelector('body').dataset.quickShopShowCart === 'true';

        if (showCart && e.type === 'afterButtonAnimation' && e.namespace === 'ajaxCart') {
          openCartDrawer();
        }
      } else {
        openCartDrawer();
      }

      $("body").removeAttr("data-item-added-to-cart-id");
    });

    $(".product-card--trigger-icon quick-shop").on("closed.quickShop", function(e, quickShopElement) {
      var showCart = document.querySelector('body').dataset.quickShopShowCart === 'true';

      if (quickShopElement) {
        const productId = $(quickShopElement).find('[name="id"]').val();

        if (showCart) {
          if (showCart && $("body").attr("data-item-added-to-cart-id") === productId) openCartDrawer();
        }

      } else {
        if (showCart) {
          openCartDrawer();
        }
      }

      $("body").removeAttr("data-item-added-to-cart-id");
    });

  }
}

cartDrawerControl();

//wait for TAB to be clicked and add class for outline accessible class
function tabClick(e) {
  if (e.keyCode === 9) {
    body.addClass('js-using-tab');
    window.removeEventListener('keydown', tabClick);
  }
}
window.addEventListener('keydown', tabClick);

//mobile sliders
document.querySelectorAll('.js-page-products').forEach(function setProductsLayout(element, index) {
    var thisSectionId = $(element).data("section-id");
  theme.layoutSlider(".js-layout-slider-" + thisSectionId);
});
document.querySelectorAll('.js-home-testimonials').forEach(function setHomeTestimonialsLayout(element, index) {
    var thisSectionId = $(element).data("section-id");
  theme.layoutSlider(".js-layout-slider-" + thisSectionId);
});
document.querySelectorAll('.js-home-collection-list').forEach(function setHomeCollectionListLayout(element, index) {
    var thisSectionId = $(element).data("section-id");
  theme.layoutSlider(".js-layout-slider-" + thisSectionId);
});
document.querySelectorAll('.js-events').forEach(function setEventsLayout(element, index) {
    var thisSectionId = $(element).data("section-id");
  theme.layoutSlider(".js-layout-slider-" + thisSectionId);
});

//fitvids
$(".video-wrapper").fitVids();
//rich text fitvids
$('.rte iframe[src*="youtube"]')
.parent()
.fitVids();
$('.rte iframe[src*="vimeo"]')
.parent()
.fitVids();

//rich text table overflow
$(".rte table").wrap(
"<div style='overflow:auto;-webkit-overflow-scrolling:touch'></div>"
);

//announcement bar popup trigger click
$(document).on("click touchend", ".js-announcement-popup-trigger", function(e) {
theme.mfpOpen("announcement-popup", this.dataset.popupId);
e.preventDefault();
});
//search popup trigger click
$(document).on("click touchend", ".js-product-popup-trigger", function(e) {
theme.mfpOpen("product-popup", this.dataset.popupId);
e.preventDefault();
});
//search popup trigger click
$(document).on("click touchend", ".js-search-trigger", function(e) {
theme.mfpOpen("search");
e.preventDefault();
});
//cart popup trigger click
if (theme.cart_ajax) {
$(document).on("click touchend", ".js-cart-trigger", function(e) {
  theme.mfpOpen("cart");
  e.preventDefault();
});
}
//mobile menu drawer trigger click
$(document).on("click touchend", ".js-mobile-draw-trigger", function(e) {
theme.mfpOpen("menu-draw");
e.preventDefault();
});

//mobile menu drawer trigger click
$(document).on("click touchend", ".js-store-availability-draw-trigger", function(e) {
theme.mfpOpen("store-availability-draw");
e.preventDefault();
});

//collection sidebar drawer trigger click
$(document).on("click touchend", ".js-collection-draw-trigger", function(e) {
theme.mfpOpen("collection-draw");
e.preventDefault();
});

//magnific js close link
$(document).on("click touchend", ".js-close-mfp", function(e) {
$.magnificPopup.close();
e.preventDefault();
});

//fixing lazyload image masonry layout
$('.o-layout--masonry').imagesLoaded().always ( function() {
  theme.masonryLayout();
});

//general
//check if recommended products are not present and init cart
//checking to avoid double cart initiation
if (document.querySelector('.js-product-recommendations') === null) {
  theme.runAjaxCart();
}

theme.animScroll();

theme.headerScrollUp();
theme.headerStickyClass();

theme.productRecommendations();
theme.masonryLayout();
theme.triggerActive();
// theme.headerNav();
theme.localizeToggle();
theme.magnificVideo();
theme.ageCheckerCookie();
theme.promoPopCookie();
theme.scrollToDiv();
theme.cartCheckbox();

//homepage
theme.homeMaps();
theme.homeVideoGallery();
theme.homeMainCarousel();
theme.homeFeaturedCollection();
theme.testimonialsCarousel();
theme.logoCarousel();

//sections everywhere
theme.sectionMultiColumn();

//product single
theme.thumbsCarousel();

/*============================================================================
  Money Format
  - Shopify.format money is defined in option_selection.js.
  If that file is not included, it is redefined here.
==============================================================================*/
if (typeof Shopify === "undefined") {
  Shopify = {};
}
if (!Shopify.formatMoney) {
  Shopify.formatMoney = function(cents, format) {
  var value = "",
    placeholderRegex = /\{\{\s*(\w+)\s*\}\}/,
    formatString = format || this.money_format;

  if (typeof cents == "string") {
    cents = cents.replace(".", "");
  }

  function defaultOption(opt, def) {
    return typeof opt == "undefined" ? def : opt;
  }

  function formatWithDelimiters(number, precision, thousands, decimal) {
    precision = defaultOption(precision, 2);
    thousands = defaultOption(thousands, ",");
    decimal = defaultOption(decimal, ".");

    if (isNaN(number) || number === null) {
    return 0;
    }

    number = (number / 100.0).toFixed(precision);

    var parts = number.split("."),
    dollars = parts[0].replace(
      /(\d)(?=(\d\d\d)+(?!\d))/g,
      "$1" + thousands
    ),
    cents = parts[1] ? decimal + parts[1] : "";

    return dollars + cents;
  }

  switch (formatString.match(placeholderRegex)[1]) {
    case "amount":
    value = formatWithDelimiters(cents, 2);
    break;
    case "amount_no_decimals":
    value = formatWithDelimiters(cents, 0);
    break;
    case "amount_with_comma_separator":
    value = formatWithDelimiters(cents, 2, ".", ",");
    break;
    case "amount_no_decimals_with_comma_separator":
    value = formatWithDelimiters(cents, 0, ".", ",");
    break;
  }

  return formatString.replace(placeholderRegex, value);
  };
}

// Get modal elements
const openModalBtn = document.getElementById('openModalBtn');
const modalOverlay = document.getElementById('modalOverlay');
const modalContent = document.getElementById('modalContent');
const closeModalBtn = document.getElementById('closeModalBtn');

// Open modal
openModalBtn.addEventListener('click', () => {
  modalOverlay.classList.add('modal-visible');
});

// Close modal
function closeModal() {
  modalOverlay.classList.remove('modal-visible');
}

closeModalBtn.addEventListener('click', closeModal);

// Close modal if user clicks outside the modal content
modalOverlay.addEventListener('click', (event) => {
  if (event.target === modalOverlay) {
    closeModal();
  }
});