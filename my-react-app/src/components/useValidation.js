import { useState } from 'react';
import { validations } from './Validations';

const useValidation = (initialValue, rules) => {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState('');

  const validate = (newValue) => {
    for (const rule of rules) {
      const [ruleFunc, ...args] = rule;
      const validationResult = validations[ruleFunc](newValue, ...args);
      if (validationResult !== true) {
        setError(validationResult);
        return false;
      }
    }
    setError('');
    return true;
  };

  const handleChange = (newValue) => {
    setValue(newValue);
    validate(newValue);
  };

  return { value, error, handleChange };
};
