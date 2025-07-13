/**
 * Hook pour la gestion du formulaire de création de roadtrip
 */
import { useState, useCallback } from 'react';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule;
};

interface UseRoadtripFormProps<T> {
  initialData: T;
  validationRules?: Partial<ValidationRules<T>>;
}

type FormErrors<T> = {
  [K in keyof T]?: string;
};

export function useRoadtripForm<T extends Record<string, any>>({
  initialData,
  validationRules = {},
}: UseRoadtripFormProps<T>) {
  const [formData, setFormData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Partial<FormErrors<T>>>({});
  const [touched, setTouched] = useState<Set<keyof T>>(new Set());

  const validateField = useCallback((fieldName: keyof T, value: any): string | null => {
    const rules = (validationRules as any)[fieldName];
    if (!rules) return null;

    // Required validation
    if (rules.required && (!value || value === '')) {
      return 'Ce champ est obligatoire';
    }

    // Skip other validations if field is empty and not required
    if (!value && !rules.required) {
      return null;
    }

    // String validations
    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        return `Minimum ${rules.minLength} caractères requis`;
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        return `Maximum ${rules.maxLength} caractères autorisés`;
      }
      if (rules.pattern && !rules.pattern.test(value)) {
        return 'Format invalide';
      }
    }

    // Number validations
    if (typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        return `Valeur minimum: ${rules.min}`;
      }
      if (rules.max !== undefined && value > rules.max) {
        return `Valeur maximum: ${rules.max}`;
      }
    }

    // Custom validation
    if (rules.custom) {
      return rules.custom(value);
    }

    return null;
  }, [validationRules]);

  const updateField = useCallback((fieldName: keyof T, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value,
    }));

    // Mark field as touched
    setTouched(prev => new Set(prev).add(fieldName));

    // Validate field
    const error = validateField(fieldName, value);
    setErrors(prev => ({
      ...prev,
      [fieldName]: error || undefined,
    }));
  }, [validateField]);

  const validateForm = useCallback((): boolean => {
    const newErrors: any = {};
    let isValid = true;

    // Validate all fields
    Object.keys(formData).forEach(fieldName => {
      const key = fieldName as keyof T;
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    
    // Mark all fields as touched
    setTouched(new Set(Object.keys(formData) as (keyof T)[]));
    
    return isValid;
  }, [formData, validateField]);

  const resetForm = useCallback(() => {
    setFormData(initialData);
    setErrors({});
    setTouched(new Set());
  }, [initialData]);

  // Check if form is valid (no errors in touched fields)
  const isValid = Object.keys(errors).every(key => !(errors as any)[key]);

  return {
    formData,
    errors,
    touched,
    isValid,
    updateField,
    validateForm,
    resetForm,
  };
}

export default useRoadtripForm;
