export class ControlManager {
    constructor() {
        this.controls = new Map();
        this.defaultTransformers = {
            value: (value) => value,
            display: (value) => value,
            update: (value) => value,
        };
    }

    /**
     * Add a control with its associated display and handlers
     * @param {Object} config Configuration object for the control
     * @param {string} config.name Name of the control
     * @param {string} config.controlId HTML ID of the control element
     * @param {string} config.valueId HTML ID of the value display element
     * @param {Object} [config.transformers] Value transformation functions
     * @param {Function} [config.transformers.value] Transform input value before processing
     * @param {Function} [config.transformers.display] Transform value for display
     * @param {Function} [config.transformers.update] Transform value before updating state
     * @param {Function} [config.onChange] Additional callback for value changes
     * @param {*} [config.initialValue] Initial value for the control
     */
    addControl({
        name,
        controlId,
        valueId,
        transformers = {},
        onChange = null,
        initialValue = null
    }) {
        const control = document.getElementById(controlId);
        const valueDisplay = document.getElementById(valueId);

        if (!control || !valueDisplay) {
            throw new Error(`Could not find elements for control: ${name}`);
        }

        const controlData = {
            name,
            control,
            valueDisplay,
            value: initialValue || control.value,
            transformers: { ...this.defaultTransformers, ...transformers },
            onChange
        };

        this.controls.set(name, controlData);

        // Set up event listener
        control.addEventListener('input', (event) => this.handleControlChange(name, event));

        // Initialize display
        this.updateDisplay(name, controlData.value);

        return this;
    }

    /**
     * Handle changes to a control
     * @private
     */
    handleControlChange(name, event) {
        const controlData = this.controls.get(name);
        if (!controlData) return;

        const rawValue = event.target.value;
        const transformedValue = controlData.transformers.value(rawValue);
        const displayValue = controlData.transformers.display(transformedValue);
        const updatedValue = controlData.transformers.update(transformedValue);

        // Update internal state
        controlData.value = updatedValue;

        // Update display
        this.updateDisplay(name, displayValue);

        // Call custom onChange handler if provided
        if (controlData.onChange) {
            controlData.onChange(updatedValue, controlData);
        }
    }

    /**
     * Update the display value for a control
     * @private
     */
    updateDisplay(name, value) {
        const controlData = this.controls.get(name);
        if (!controlData) return;

        controlData.valueDisplay.value = value;
        controlData.valueDisplay.textContent = value;
    }

    /**
     * Get the current value of a control
     */
    getValue(name) {
        const controlData = this.controls.get(name);
        return controlData ? controlData.value : null;
    }

    /**
     * Set the value of a control
     */
    setValue(name, value) {
        const controlData = this.controls.get(name);
        if (!controlData) return;

        controlData.control.value = value;
        const event = new Event('input');
        controlData.control.dispatchEvent(event);
    }

    /**
     * Get all current control values
     */
    getAllValues() {
        const values = {};
        this.controls.forEach((controlData, name) => {
            values[name] = controlData.value;
        });
        return values;
    }

    /**
     * Remove a control
     */
    removeControl(name) {
        const controlData = this.controls.get(name);
        if (controlData) {
            controlData.control.removeEventListener('input', controlData.handler);
            this.controls.delete(name);
        }
    }

    /**
     * Update the onChange handler for a control
     */
    setOnChange(name, handler) {
        const controlData = this.controls.get(name);
        if (controlData) {
            controlData.onChange = handler;
        }
    }
}
