/**
 * Hook pour gérer les formulaires avec validation
 */
import { useState, useCallback } from 'react';

export interface FormField {
  value: string;
  error?: string;
  isValid: boolean;
}

export interface FormState {
  [key: string]: FormField;
}

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | undefined;
}

export interface FormValidation {
  [key: string]: ValidationRule;
}

export const useForm = (initialState: Record<string, string>, validationRules?: FormValidation) => {
  // État du formulaire
  const [formState, setFormState] = useState<FormState>(() => {
    const state: FormState = {};
    Object.keys(initialState).forEach(key => {
      state[key] = {
        value: initialState[key],
        isValid: true,
      };
    });
    return state;
  });

  // Validation d'un champ
  const validateField = useCallback((fieldName: string, value: string): string | undefined => {
    if (!validationRules || !validationRules[fieldName]) return undefined;

    const rules = validationRules[fieldName];

    // Required
    if (rules.required && (!value || value.trim() === '')) {
      return 'Ce champ est obligatoire';
    }

    // Min length
    if (rules.minLength && value.length < rules.minLength) {
      return `Minimum ${rules.minLength} caractères requis`;
    }

    // Max length
    if (rules.maxLength && value.length > rules.maxLength) {
      return `Maximum ${rules.maxLength} caractères autorisés`;
    }

    // Pattern
    if (rules.pattern && !rules.pattern.test(value)) {
      return 'Format invalide';
    }

    // Custom validation
    if (rules.custom) {
      return rules.custom(value);
    }

    return undefined;
  }, [validationRules]);

  // Mise à jour d'un champ
  const updateField = useCallback((fieldName: string, value: string) => {
    const error = validateField(fieldName, value);
    
    setFormState(prev => ({
      ...prev,
      [fieldName]: {
        value,
        error,
        isValid: !error,
      },
    }));
  }, [validateField]);

  // Validation de tout le formulaire
  const validateForm = useCallback((): boolean => {
    let isFormValid = true;
    const newFormState = { ...formState };

    Object.keys(formState).forEach(fieldName => {
      const error = validateField(fieldName, formState[fieldName].value);
      newFormState[fieldName] = {
        ...formState[fieldName],
        error,
        isValid: !error,
      };

      if (error) {
        isFormValid = false;
      }
    });

    setFormState(newFormState);
    return isFormValid;
  }, [formState, validateField]);

  // Reset du formulaire
  const resetForm = useCallback(() => {
    const resetState: FormState = {};
    Object.keys(initialState).forEach(key => {
      resetState[key] = {
        value: initialState[key],
        isValid: true,
      };
    });
    setFormState(resetState);
  }, [initialState]);

  // Obtenir les valeurs du formulaire
  const getFormValues = useCallback((): Record<string, string> => {
    const values: Record<string, string> = {};
    Object.keys(formState).forEach(key => {
      values[key] = formState[key].value;
    });
    return values;
  }, [formState]);

  // Vérifier si le formulaire est valide
  const isFormValid = Object.values(formState).every(field => field.isValid);

  return {
    formState,
    updateField,
    validateForm,
    resetForm,
    getFormValues,
    isFormValid,
  };
};
