export const validations = {
    required: (value) => value.trim() !== '' || 'This field cannot be empty',
    isNumber: (value) => !isNaN(value) || 'Only numbers are allowed',
    maxLength: (value, max) => value.length <= max || `Max length is ${max}`,
    minValue: (value, min) => value >= min || `Minimum value is ${min}`,
    maxValue: (value, max) => value <= max || `Maximum value is ${max}`,
  };
  