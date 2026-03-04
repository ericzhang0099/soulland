'use client';

import { useState, useEffect, useCallback } from 'react';

interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
}

interface UseFormOptions<T> {
  initialValues: T;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
  onSubmit: (values: T) => Promise<void>;
}

export function useForm<T extends Record<string, any>>(options: UseFormOptions<T>) {
  const { initialValues, validate, onSubmit } = options;

  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateValues = useCallback(
    (vals: T) => {
      if (validate) {
        return validate(vals);
      }
      return {};
    },
    [validate]
  );

  const setValue = useCallback(
    (field: keyof T, value: any) => {
      setValues((prev) => {
        const newValues = { ...prev, [field]: value };
        const newErrors = validateValues(newValues);
        setErrors(newErrors);
        return newValues;
      });
    },
    [validateValues]
  );

  const setTouchedField = useCallback((field: keyof T) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const handleChange = useCallback(
    (field: keyof T) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(field, e.target.value);
    },
    [setValue]
  );

  const handleBlur = useCallback(
    (field: keyof T) => () => {
      setTouchedField(field);
    },
    [setTouchedField]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const validationErrors = validateValues(values);
      setErrors(validationErrors);

      // 标记所有字段为touched
      const allTouched = Object.keys(values).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {}
      );
      setTouched(allTouched);

      if (Object.keys(validationErrors).length === 0) {
        setIsSubmitting(true);
        try {
          await onSubmit(values);
        } finally {
          setIsSubmitting(false);
        }
      }
    },
    [values, validateValues, onSubmit]
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const isValid = Object.keys(errors).length === 0;

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    setValue,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
  };
}

// 表单验证规则
export const validators = {
  required: (value: any) => {
    if (value === undefined || value === null || value === '') {
      return '此字段为必填项';
    }
    return undefined;
  },

  email: (value: string) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return '请输入有效的邮箱地址';
    }
    return undefined;
  },

  minLength: (min: number) => (value: string) => {
    if (value.length < min) {
      return `至少需要 ${min} 个字符`;
    }
    return undefined;
  },

  maxLength: (max: number) => (value: string) => {
    if (value.length > max) {
      return `最多 ${max} 个字符`;
    }
    return undefined;
  },

  number: (value: any) => {
    if (isNaN(Number(value))) {
      return '请输入数字';
    }
    return undefined;
  },

  positive: (value: number) => {
    if (Number(value) <= 0) {
      return '必须大于0';
    }
    return undefined;
  },

  ethereumAddress: (value: string) => {
    if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
      return '请输入有效的以太坊地址';
    }
    return undefined;
  },
};

// 组合验证器
export function compose(...validators: Array<(value: any) => string | undefined>) {
  return (value: any) => {
    for (const validator of validators) {
      const error = validator(value);
      if (error) return error;
    }
    return undefined;
  };
}
