import { useState, useCallback, ChangeEvent, FormEvent } from 'react';

interface ValidationRules<T> {
  [key: string]: (value: any, formValues: T) => string | null;
}

interface FormOptions<T> {
  initialValues: T;
  validationRules?: ValidationRules<T>;
  onSubmit?: (values: T) => void | Promise<void>;
}

interface FormReturn<T> {
  values: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleBlur: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  setFieldValue: (name: keyof T, value: any) => void;
  setFieldError: (name: keyof T, error: string) => void;
  setFieldTouched: (name: keyof T, isTouched: boolean) => void;
  resetForm: () => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
  isValid: boolean;
}

function useForm<T extends Record<string, any>>({
  initialValues,
  validationRules = {},
  onSubmit,
}: FormOptions<T>): FormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<keyof T, string>>({} as Record<keyof T, string>);
  const [touched, setTouched] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize keys for touched and errors
  useState(() => {
    const initialTouched = {} as Record<keyof T, boolean>;
    const initialErrors = {} as Record<keyof T, string>;
    
    Object.keys(initialValues).forEach((key) => {
      initialTouched[key as keyof T] = false;
      initialErrors[key as keyof T] = '';
    });
    
    setTouched(initialTouched);
    setErrors(initialErrors);
  });

  // Validate a single field
  const validateField = useCallback(
    (name: keyof T, value: any): string => {
      const validator = validationRules[name as string];
      if (!validator) return '';
      
      const error = validator(value, values);
      return error || '';
    },
    [validationRules, values]
  );

  // Validate all fields
  const validateForm = useCallback((): Record<keyof T, string> => {
    const newErrors = {} as Record<keyof T, string>;
    
    Object.keys(values).forEach((key) => {
      const fieldKey = key as keyof T;
      const error = validateField(fieldKey, values[fieldKey]);
      if (error) {
        newErrors[fieldKey] = error;
      } else {
        newErrors[fieldKey] = '';
      }
    });
    
    return newErrors;
  }, [validateField, values]);

  // Check if the form is valid
  const isValid = useCallback((): boolean => {
    const formErrors = validateForm();
    return Object.values(formErrors).every((error) => !error);
  }, [validateForm]);

  // Handle input change
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      
      // Convert value based on input type
      let processedValue: any = value;
      
      if (type === 'number') {
        processedValue = value === '' ? '' : Number(value);
      } else if (type === 'checkbox') {
        processedValue = (e.target as HTMLInputElement).checked;
      }
      
      setValues((prevValues) => ({
        ...prevValues,
        [name]: processedValue,
      }));
      
      // Validate field and update errors
      const fieldError = validateField(name as keyof T, processedValue);
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: fieldError,
      }));
    },
    [validateField]
  );

  // Handle input blur
  const handleBlur = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name } = e.target;
      
      setTouched((prevTouched) => ({
        ...prevTouched,
        [name]: true,
      }));
      
      // Validate field on blur
      const fieldError = validateField(name as keyof T, values[name as keyof T]);
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: fieldError,
      }));
    },
    [validateField, values]
  );

  // Set field value programmatically
  const setFieldValue = useCallback((name: keyof T, value: any) => {
    setValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
    
    // Validate field
    const fieldError = validateField(name, value);
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: fieldError,
    }));
  }, [validateField]);

  // Set field error programmatically
  const setFieldError = useCallback((name: keyof T, error: string) => {
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: error,
    }));
  }, []);

  // Set field touched programmatically
  const setFieldTouched = useCallback((name: keyof T, isTouched: boolean) => {
    setTouched((prevTouched) => ({
      ...prevTouched,
      [name]: isTouched,
    }));
  }, []);

  // Reset the form to initial values
  const resetForm = useCallback(() => {
    setValues(initialValues);
    
    const initialTouched = {} as Record<keyof T, boolean>;
    const initialErrors = {} as Record<keyof T, string>;
    
    Object.keys(initialValues).forEach((key) => {
      initialTouched[key as keyof T] = false;
      initialErrors[key as keyof T] = '';
    });
    
    setTouched(initialTouched);
    setErrors(initialErrors);
    setIsSubmitting(false);
  }, [initialValues]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      
      // Validate all fields
      const formErrors = validateForm();
      setErrors(formErrors);
      
      // Set all fields as touched
      const allTouched = {} as Record<keyof T, boolean>;
      Object.keys(values).forEach((key) => {
        allTouched[key as keyof T] = true;
      });
      setTouched(allTouched);
      
      // Check if form is valid
      const formIsValid = Object.values(formErrors).every((error) => !error);
      
      if (formIsValid && onSubmit) {
        setIsSubmitting(true);
        try {
          await onSubmit(values);
        } catch (error) {
          console.error('Form submission error:', error);
        } finally {
          setIsSubmitting(false);
        }
      }
    },
    [onSubmit, validateForm, values]
  );

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    resetForm,
    handleSubmit,
    isSubmitting,
    isValid: isValid(),
  };
}

export default useForm;
