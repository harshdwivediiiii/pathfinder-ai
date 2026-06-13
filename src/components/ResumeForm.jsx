"use client";
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import './ResumeForm.css';

/**
 * @typedef {Object} FormData
 * @property {string} fullName - User's full name
 * @property {string} email - User's email address
 * @property {string} phone - User's phone number
 * @property {string} summary - Professional summary
 * @property {Array<Object>} experience - Work experience entries
 * @property {Array<Object>} education - Education entries
 * @property {Array<string>} skills - List of skills
 * @property {string} githubUrl - GitHub profile URL
 * @property {Array<string>} achievements - List of achievements
 * @property {Array<string>} certifications - List of certifications
 */

/**
 * @typedef {Object} ResumeFormProps
 * @property {(data: FormData) => Promise<void>} onSubmit - Callback function when form is submitted
 * @property {FormData} [initialData] - Initial form data for editing
 */

/**
 * @typedef {Object} ValidationRules
 * @property {RegExp} email - Email validation regex
 * @property {RegExp} phone - Phone validation regex
 * @property {RegExp} githubUrl - GitHub URL validation regex
 * @property {Object<string, number>} maxLength - Maximum length constraints
 */

/**
 * @typedef {Object} Logger
 * @property {(message: string, data?: Object) => void} info - Info level logging
 * @property {(message: string, data?: Object) => void} warn - Warning level logging
 * @property {(message: string, error?: Error|null) => void} error - Error level logging
 */

/**
 * Creates a logger instance with consistent formatting
 * @returns {Logger} Logger object
 */
const createLogger = () => ({
  info: (message, data = {}) => {
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[ResumeForm] ${message}`, data);
    }
  },
  warn: (message, data = {}) => {
    console.warn(`[ResumeForm] ${message}`, data);
  },
  error: (message, error = null) => {
    console.error(`[ResumeForm] ${message}`, error);
  }
});

/**
 * Validation constants
 * @type {ValidationRules}
 */
const VALIDATION = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\./0-9]*$/,
  githubUrl: /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/,
  maxLength: {
    fullName: 100,
    email: 254,
    phone: 20,
    summary: 500,
    achievement: 200,
    certification: 200
  }
};

/**
 * Sanitizes input string to prevent XSS attacks
 * @param {string} input - Input string to sanitize
 * @returns {string} Sanitized string
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
};

/**
 * Validates a single form field
 * @param {string} name - Field name
 * @param {*} value - Field value
 * @param {ValidationRules} validationRules - Validation rules
 * @returns {string|null} Error message or null if valid
 */
const validateField = (name, value, validationRules) => {
  try {
    switch (name) {
      case 'fullName':
        if (!value?.trim()) return 'Full name is required';
        if (value.length > validationRules.maxLength.fullName) {
          return `Name must be ${validationRules.maxLength.fullName} characters or less`;
        }
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        return null;

      case 'email':
        if (!value?.trim()) return 'Email is required';
        if (!validationRules.email.test(value)) return 'Please enter a valid email address';
        if (value.length > validationRules.maxLength.email) {
          return `Email must be ${validationRules.maxLength.email} characters or less`;
        }
        return null;

      case 'phone':
        if (!value?.trim()) return 'Phone number is required';
        if (!validationRules.phone.test(value)) return 'Please enter a valid phone number';
        if (value.length > validationRules.maxLength.phone) {
          return `Phone must be ${validationRules.maxLength.phone} characters or less`;
        }
        return null;

      case 'githubUrl':
        if (value?.trim() && !validationRules.githubUrl.test(value)) {
          return 'Please enter a valid GitHub URL (e.g., https://github.com/username)';
        }
        return null;

      case 'summary':
        if (value?.length > validationRules.maxLength.summary) {
          return `Summary must be ${validationRules.maxLength.summary} characters or less`;
        }
        return null;

      default:
        return null;
    }
  } catch (error) {
    console.error(`[ResumeForm] Validation error for field ${name}`, error);
    return 'Validation error occurred';
  }
};

/**
 * ResumeForm Component
 * 
 * A comprehensive resume builder form with support for personal information,
 * GitHub URL, achievements, and certifications. Includes full validation,
 * error handling, accessibility features, and performance optimizations.
 * 
 * @component
 * @param {ResumeFormProps} props - Component props
 * @returns {JSX.Element} Rendered form component
 */
const ResumeForm = ({ onSubmit, initialData = {} }) => {
  const logger = useMemo(() => createLogger(), []);
  const formRef = useRef(null);
  const [formData, setFormData] = useState(() => ({
    fullName: '',
    email: '',
    phone: '',
    summary: '',
    experience: [],
    education: [],
    skills: [],
    githubUrl: '',
    achievements: [],
    certifications: [],
    ...initialData
  }));
  const [newAchievement, setNewAchievement] = useState('');
  const [newCertification, setNewCertification] = useState('');
  const [editingAchievementIndex, setEditingAchievementIndex] = useState(null);
  const [editingCertificationIndex, setEditingCertificationIndex] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({});

  // Performance optimization: memoize validation
  const validationRules = useMemo(() => VALIDATION, []);

  /**
   * Validates all form fields
   * @returns {Object<string, string>} Object containing field errors
   */
  const validateForm = useCallback(() => {
    try {
      const newErrors = {};
      const fieldsToValidate = ['fullName', 'email', 'phone', 'githubUrl', 'summary'];
      
      fieldsToValidate.forEach(field => {
        const error = validateField(field, formData[field], validationRules);
        if (error) newErrors[field] = error;
      });

      // Validate achievements and certifications arrays
      if (formData.achievements.length > 50) {
        newErrors.achievements = 'Maximum 50 achievements allowed';
      }
      if (formData.certifications.length > 50) {
        newErrors.certifications = 'Maximum 50 certifications allowed';
      }

      return newErrors;
    } catch (error) {
      logger.error('Form validation error', error);
      return { form: 'Form validation failed. Please try again.' };
    }
  }, [formData, validationRules, logger]);

  /**
   * Handles input changes for simple fields with debouncing
   * @param {React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>} e - Change event
   */
  const handleInputChange = useCallback((e) => {
    try {
      const { name, value } = e.target;
      const sanitizedValue = sanitizeInput(value);
      
      setFormData(prev => ({
        ...prev,
        [name]: sanitizedValue
      }));

      // Clear error when user starts typing
      if (errors[name]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }

      logger.info(`Field ${name} updated`, { value: sanitizedValue });
    } catch (error) {
      logger.error('Error handling input change', error);
    }
  }, [errors, logger]);

  /**
   * Handles blur events for validation on touch
   * @param {React.FocusEvent<HTMLInputElement|HTMLTextAreaElement>} e - Blur event
   */
  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    const error = validateField(name, value, validationRules);
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [validationRules]);

  /**
   * Adds a new achievement to the list
   */
  const handleAddAchievement = useCallback(() => {
    const sanitized = sanitizeInput(newAchievement);
    if (!sanitized) return;
    if (sanitized.length > VALIDATION.maxLength.achievement) {
      setErrors(prev => ({ ...prev, achievements: `Achievement must be ${VALIDATION.maxLength.achievement} characters or less` }));
      return;
    }
    setFormData(prev => ({
      ...prev,
      achievements: [...prev.achievements, sanitized]
    }));
    setNewAchievement('');
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.achievements;
      return newErrors;
    });
  }, [newAchievement]);

  /**
   * Removes an achievement from the list
   * @param {number} index - Index of achievement to remove
   */
  const handleRemoveAchievement = useCallback((index) => {
    setFormData(prev => ({
      ...prev,
      achievements: prev.achievements.filter((_, i) => i !== index)
    }));
  }, []);

  /**
   * Starts editing an achievement
   * @param {number} index - Index of achievement to edit
   */
  const handleEditAchievement = useCallback((index) => {
    setEditingAchievementIndex(index);
    setNewAchievement(formData.achievements[index]);
  }, [formData.achievements]);

  /**
   * Saves the edited achievement
   */
  const handleSaveAchievement = useCallback(() => {
    if (editingAchievementIndex === null) return;
    const sanitized = sanitizeInput(newAchievement);
    if (!sanitized) return;
    if (sanitized.length > VALIDATION.maxLength.achievement) {
      setErrors(prev => ({ ...prev, achievements: `Achievement must be ${VALIDATION.maxLength.achievement} characters or less` }));
      return;
    }
    setFormData(prev => {
      const updated = [...prev.achievements];
      updated[editingAchievementIndex] = sanitized;
      return { ...prev, achievements: updated };
    });
    setEditingAchievementIndex(null);
    setNewAchievement('');
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.achievements;
      return newErrors;
    });
  }, [editingAchievementIndex, newAchievement]);

  /**
   * Adds a new certification to the list
   */
  const handleAddCertification = useCallback(() => {
    const sanitized = sanitizeInput(newCertification);
    if (!sanitized) return;
    if (sanitized.length > VALIDATION.maxLength.certification) {
      setErrors(prev => ({ ...prev, certifications: `Certification must be ${VALIDATION.maxLength.certification} characters or less` }));
      return;
    }
    setFormData(prev => ({
      ...prev,
      certifications: [...prev.certifications, sanitized]
    }));
    setNewCertification('');
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.certifications;
      return newErrors;
    });
  }, [newCertification]);

  /**
   * Removes a certification from the list
   * @param {number} index - Index of certification to remove
   */
  const handleRemoveCertification = useCallback((index) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  }, []);

  /**
   * Starts editing a certification
   * @param {number} index - Index of certification to edit
   */
  const handleEditCertification = useCallback((index) => {
    setEditingCertificationIndex(index);
    setNewCertification(formData.certifications[index]);
  }, [formData.certifications]);

  /**
   * Saves the edited certification
   */
  const handleSaveCertification = useCallback(() => {
    if (editingCertificationIndex === null) return;
    const sanitized = sanitizeInput(newCertification);
    if (!sanitized) return;
    if (sanitized.length > VALIDATION.maxLength.certification) {
      setErrors(prev => ({ ...prev, certifications: `Certification must be ${VALIDATION.maxLength.certification} characters or less` }));
      return;
    }
    setFormData(prev => {
      const updated = [...prev.certifications];
      updated[editingCertificationIndex] = sanitized;
      return { ...prev, certifications: updated };
    });
    setEditingCertificationIndex(null);
    setNewCertification('');
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.certifications;
      return newErrors;
    });
  }, [editingCertificationIndex, newCertification]);

  /**
   * Handles form submission
   * @param {React.FormEvent<HTMLFormElement>} e - Form submit event
   */
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    try {
      const validationErrors = validateForm();
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setTouched({
          fullName: true,
          email: true,
          phone: true,
          githubUrl: true,
          summary: true
        });
        return;
      }

      setIsSubmitting(true);
      await onSubmit(formData);
      logger.info('Form submitted successfully', { formData });
    } catch (error) {
      logger.error('Form submission error', error);
      setErrors({ form: 'Failed to submit form. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, onSubmit, logger]);

  return (
    <form 
      ref={formRef}
      className="resume-form" 
      onSubmit={handleSubmit}
      noValidate
      aria-label="Resume Builder Form"
    >
      {errors.form && (
        <div className="form-error form-error--general" role="alert">
          {errors.form}
        </div>
      )}

      <fieldset className="form-section">
        <legend className="form-section__title">Personal Information</legend>
        
        <div className="form-group">
          <label htmlFor="fullName" className="form-label">
            Full Name <span className="required" aria-hidden="true">*</span>
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            onBlur={handleBlur}
            className={`form-input ${errors.fullName && touched.fullName ? 'form-input--error' : ''}`}
            placeholder="John Doe"
            maxLength={VALIDATION.maxLength.fullName}
            required
            aria-required="true"
            aria-invalid={errors.fullName && touched.fullName ? 'true' : 'false'}
            aria-describedby={errors.fullName && touched.fullName ? 'fullName-error' : undefined}
          />
          {errors.fullName && touched.fullName && (
            <span id="fullName-error" className="form-error" role="alert">{errors.fullName}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="email" className="form-label">
            Email <span className="required" aria-hidden="true">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            onBlur={handleBlur}
            className={`form-input ${errors.email && touched.email ? 'form-input--error' : ''}`}
            placeholder="john@example.com"
            maxLength={VALIDATION.maxLength.email}
            required
            aria-required="true"
            aria-invalid={errors.email && touched.email ? 'true' : 'false'}
            aria-describedby={errors.email && touched.email ? 'email-error' : undefined}
          />
          {errors.email && touched.email && (
            <span id="email-error" className="form-error" role="alert">{errors.email}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="phone" className="form-label">
            Phone <span className="required" aria-hidden="true">*</span>
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            onBlur={handleBlur}
            className={`form-input ${errors.phone && touched.phone ? 'form-input--error' : ''}`}
            placeholder="+1 (555) 123-4567"
            maxLength={VALIDATION.maxLength.phone}
            required
            aria-required="true"
            aria-invalid={errors.phone && touched.phone ? 'true' : 'false'}
            aria-describedby={errors.phone && touched.