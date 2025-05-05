class ProductInteractiveOptions extends HTMLElement {
  constructor() {
    super();
    this.variantsControlElement = this.parentElement;
    this.variants = this.variantsControlElement.getVariantData();
    this.inputs = this.getOptionsElementsObject();
    this.options = Object.keys(this.inputs).reduce((options, key) => {
      // eslint-disable-next-line no-param-reassign
      options[this.inputs[key].position] = key;
      return options;
    }, []);
    this.currentVariant = this.getCurrentVariant();

    this.setOptionInputsAvailability();
    this.setUpInputListeners();

    if (this.dataset.variantId) {
      const id = Number(this.dataset.variantId);
      this.selectVariantById(id);
    }
  }

  getOptionsElementsObject() {
    const options = Array.from(this.variantsControlElement.querySelectorAll('input, select > option'));
    const obj = options.reduce((finalObject, el) => {
      if (el.nodeName === 'INPUT') {
        const optionName = el.name.trim();
        // eslint-disable-next-line no-param-reassign
        if (!finalObject.hasOwnProperty(optionName)) finalObject[optionName] = {
          position: Object.keys(finalObject).length,
          type: 'inputs',
          elements: {},
        }
        // eslint-disable-next-line no-param-reassign
        finalObject[optionName].elements[el.value] = {
          element: el
        };
      } else if (el.nodeName === 'OPTION') {
        const selectElement = el.parentElement;
        const optionName = selectElement.name.replace('options[', '').replace(']', '').trim();
        if (!finalObject.hasOwnProperty(optionName)) {
          // eslint-disable-next-line no-param-reassign
          finalObject[optionName] = {
            position: Object.keys(finalObject).length,
            type: 'select',
            elements: {},
            selectElement,
          }
        }
        // eslint-disable-next-line no-param-reassign
        finalObject[optionName].elements[el.value] = {
          element: el,
          text: el.innerHTML.trim(),
        };
      }
      return finalObject;
    }, {});

    return obj;
  }

  getCurrentOptions() {
    return Array.from(this.variantsControlElement.querySelectorAll('input:checked, select')).map((input) => input.value);
  }

  getCurrentVariant() {
    const options = this.getCurrentOptions();

    const result = this.variants.filter((variant) =>
      options.every((option, index) =>
        variant.options[index] === option
      )
    );

    return result[0] || null;
  }

  /**
   * Get variant object by variant id
   *
   * @param {number} id Variant id
   * @returns {(Object | null)} Variant or null if none found
   */
  getVariantById(id) {
    const [result] = this.variants.filter((variant) => variant.id === id);

    return result || null;
  }

  /**
   * Based on the current variant, return all options present
   * in available variants that start with the same main option
   * as the current variant, and include the same options in their
   * option list.
   *
   * @returns {string[]} Array of options
   */
  optionsAvailableInOtherVariants() {
    const currentVariant = this.getCurrentVariant();

    const availableVariants = this.variants.filter(
      (variant) =>
        variant.available &&
        variant.id !== currentVariant.id &&
        variant.options[0] === currentVariant.options[0],
    );

    return currentVariant.options.reduce((options, option, i) => {
      if (
        availableVariants.some((variant) =>
          variant.options
            .map((o, j) => `${o}_${j}`)
            .includes(`${option}_${i}`),
        )
      )
        options.push(`${option}_${i}`);

      return options;
    }, []);
  };

  /**
   * Setup product options display (available, unavailable, disabled)
   */
  setOptionInputsAvailability() {
    // Need to cache current variant for correct functionality
    // of option resets
    this.currentVariant = this.getCurrentVariant();

    // Disable all options
    Object.keys(this.inputs).forEach((option) => {
      Object.keys(this.inputs[option].elements).forEach((value) => {
        const { element, text } = this.inputs[option].elements[value];

        element.disabled = true;

        if (this.inputs[option].type === 'inputs') element.nextElementSibling.classList.add('is-disabled');
        if (this.inputs[option].type === 'select') element.innerHTML = `${text} - Unavailable`;
      });
    });

    // Get all the options from neighbouring available variants
    // const availableOptions = this.optionsAvailableInOtherVariants();

    const availableOptions = new Set();

    // Remove disabled status from existing options;
    // remove unavailable status from available options
    this.currentVariant.options.forEach((option, i) => {
      const optionInput = this.inputs[this.options[i]].elements[option];
      const inputType = this.inputs[this.options[i]].type;

      optionInput.element.disabled = false;

      // Remove 'is-disabled' class from the label if the current
      // variant is available, or the option exists in neighbouring
      // variants
      if (this.currentVariant.available) {
        availableOptions.add(`${this.options[i]}_${option}`);
        if (inputType === 'inputs') optionInput.element.nextElementSibling.classList.remove('is-disabled');
        if (inputType === 'select') optionInput.element.innerHTML = optionInput.text;
      }

      if (inputType === 'select' && !availableOptions.has(`${this.options[i]}_${option}`))
        optionInput.element.innerHTML = `${optionInput.text} - ${window.theme.t.sold_out}`;
    });

    // Cycle through all variants, and set options to unavailable or
    // available if exist in variant
    this.variants.forEach((variant) => {

      if (
        variant.id !== this.currentVariant.id &&
        variant.options[0] === this.currentVariant.options[0]
      ) {
        variant.options.every((option, i) => {
          if (
            i > 0 &&
            variant.options[i - 1] === this.currentVariant.options[i - 1]
          ) {
            const optionInput = this.inputs[this.options[i]].elements[option];
            const inputType = this.inputs[this.options[i]].type;

            optionInput.element.disabled = false;

            if (!this.currentVariant.available && this.currentVariant.options.includes(option)) return true;

            if (variant.available) {
              availableOptions.add(`${this.options[i]}_${option}`);
              if (inputType === 'inputs') optionInput.element.nextElementSibling.classList.remove('is-disabled');
              if (inputType === 'select') optionInput.element.innerHTML = optionInput.text;
            }

            if (inputType === 'select' && !availableOptions.has(`${this.options[i]}_${option}`))
              optionInput.element.innerHTML = `${optionInput.text} - ${window.theme.t.sold_out}`;
          }

          return true;
        });
      } else if (variant.id !== this.currentVariant.id) {
        // Only need the main option of the variants which don't
        // share main option with the current variant
        const optionInput = this.inputs[this.options[0]].elements[variant.options[0]];
        const inputType = this.inputs[this.options[0]].type;

        optionInput.element.disabled = false;

        if (variant.available) {
          availableOptions.add(`${this.options[0]}_${variant.options[0]}`);
          if (inputType === 'inputs') optionInput.element.nextElementSibling.classList.remove('is-disabled');
          if (inputType === 'select') optionInput.element.innerHTML = optionInput.text;
        }

        if (inputType === 'select' && !availableOptions.has(`${this.options[0]}_${variant.options[0]}`))
          optionInput.element.innerHTML = `${optionInput.text} - ${window.theme.t.sold_out}`;
      }
    });
  };

  /**
   * Get the first available existing variant the option belongs to. If
   * no available variants exist, return the first existing one. Otherwise
   * return null.
   *
   * @param {string} option Reference option
   * @param {string} optionGroup Option group to which the option belongs
   * @returns {(Object | null)} Variant or null if none found
   */
  getFirstExistingVariant(option, optionGroup) {
    const optionPosition = this.options.indexOf(optionGroup);

    const existingVariantsWithOption = this.variants.filter(
      (variant) =>
        variant.options[optionPosition] === option &&
        (optionPosition === 0 ||
          variant.options
            .slice(0, optionPosition)
            .every((o, index) => o === this.currentVariant.options[index])),
    );

    for (let i = 0, l = existingVariantsWithOption.length; i < l; i += 1) {
      if (existingVariantsWithOption[i].available) return existingVariantsWithOption[i];
    }

    return existingVariantsWithOption.length > 0
      ? existingVariantsWithOption[0]
      : null;
  };

  /**
   * Get existing variant (either available or sold out) from
   * the option specified. Otherwise return null.
   *
   * @param {string} option Reference option
   * @param {string} optionGroup Option group to which the option belongs
   * @returns {(Object | null)} Variant or null if none found
   */
  getExistingVariantFromSelectedOption(option, optionGroup) {
    const options = this.getCurrentOptions();
    const optionPosition = this.options.indexOf(optionGroup);

    options[optionPosition] = option;

    const variant = this.variants.find((v) => v.options.every((val, idx) => val === options[idx]));
    return variant || null;
  }

  /**
   * Set product form options to reflect the selected variant.
   *
   * @param {Object} variant Product variant
   */
  selectVariant(variant) {
    const currentFocusedElement = document.activeElement;
    const optionsByGroup = variant.options.reduce(
      (grouped, option, index) => {
        // eslint-disable-next-line no-param-reassign
        grouped[this.options[index]] = option;

        return grouped;
      },
      {},
    );

    Object.keys(this.inputs).forEach((option) => {
      Object.keys(this.inputs[option].elements).forEach((value) => {
        const { element, text } = this.inputs[option].elements[value];

        element.disabled = false;

        if (this.inputs[option].type === 'inputs') {
          element.nextElementSibling.classList.remove('is-disabled');
          element.checked = false;
        }
        if (this.inputs[option].type === 'select') element.innerHTML = text;

        if (
          optionsByGroup[
            option
          ] === value
        ) {
          if (this.inputs[option].type === 'inputs') element.checked = true;
          if (this.inputs[option].type === 'select') this.inputs[option].selectElement.value = value;
        }
      });
    });

    this.setOptionInputsAvailability();
    if (currentFocusedElement) {
      currentFocusedElement.focus();
    }
  };

  selectVariantById(id) {
    const variant = this.getVariantById(id);

    if (variant) {
      this.selectVariant(variant);
      this.variantsControlElement.onVariantChange();
    }
  }

  /**
   * Select variant if exists, otherwise select first existing one.
   *
   * @param {string} option Reference option
   * @param {string} optionGroup Option group to which the option belongs
   */
  selectCurrentOrFirstExistingVariant(option, optionGroup) {
    const selectedVariant = this.getExistingVariantFromSelectedOption(
      option.trim(),
      optionGroup.trim(),
    );

    if (selectedVariant) {
      this.selectVariant(selectedVariant);
    } else {
      const firstExistingVariant = this.getFirstExistingVariant(
        option.trim(),
        optionGroup.trim(),
      );

      if (firstExistingVariant) {
        this.selectVariant(firstExistingVariant);
      }
    }
  }

  setUpInputListeners() {
    // Remove the onChange event from the variant-selects or variants-radios
    this.variantsControlElement.removeEventListener('change', this.variantsControlElement.onVariantChange);

    Object.keys(this.inputs).forEach((optionGroup) => {

      if (this.inputs[optionGroup].type === 'inputs') {
        Object.keys(this.inputs[optionGroup].elements).forEach((option) => {
          const input = this.inputs[optionGroup].elements[option].element;
          input.addEventListener('click', (e) => {
            this.selectCurrentOrFirstExistingVariant(
              e.target.value.trim(),
              e.target.name.trim(),
            );
          });
        })
      } else if (this.inputs[optionGroup].type === 'select') {
        this.inputs[optionGroup].selectElement.addEventListener('change', (e) => {
          this.selectCurrentOrFirstExistingVariant(
            e.target.value.trim(),
            e.target.name.trim().replace('options[', '').replace(']', ''),
          );
        })
      }

    });

    this.variantsControlElement.addEventListener('change', this.variantsControlElement.onVariantChange);
  };
}

customElements.define('product-interactive-options', ProductInteractiveOptions);
