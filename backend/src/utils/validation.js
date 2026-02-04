import Joi from 'joi';
import mongoose from 'mongoose';
import { DONATION_CATEGORIES, PAYMENT_METHODS } from '../constants/donations.js';
import { EXPENSE_CATEGORIES } from '../constants/expenses.js';

// Login validation schema
export const loginSchema = Joi.object({
  username: Joi.string()
    .min(3)
    .required()
    .messages({
      'string.empty': 'صارف نام ضروری ہے',
      'string.min': 'صارف نام کم از کم 3 حروف کا ہونا چاہیے',
      'any.required': 'صارف نام ضروری ہے',
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.empty': 'پاس ورڈ ضروری ہے',
      'string.min': 'پاس ورڈ کم از کم 6 حروف کا ہونا چاہیے',
      'any.required': 'پاس ورڈ ضروری ہے',
    }),
});

// Donor validation schema
export const donorSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .required()
    .messages({
      'string.empty': 'نام ضروری ہے',
      'string.min': 'نام کم از کم 2 حروف کا ہونا چاہیے',
      'any.required': 'نام ضروری ہے',
    }),
  phone: Joi.string()
    .required()
    .pattern(/^[\d\s\-+()]+$/)
    .messages({
      'string.empty': 'فون نمبر ضروری ہے',
      'string.pattern.base': 'غلط فون نمبر کی شکل',
      'any.required': 'فون نمبر ضروری ہے',
    }),
  email: Joi.string()
    .email()
    .allow('', null)
    .optional()
    .messages({
      'string.email': 'غلط ای میل کی شکل',
    }),
  address: Joi.string()
    .allow('', null)
    .optional(),
});

// ObjectId validation helper
const objectId = Joi.string().custom((value, helpers) => {
  if (mongoose.Types.ObjectId.isValid(value)) return value;
  return helpers.error('any.invalid');
}, 'valid ObjectId');

// Donation validation schema (create)
export const donationSchema = Joi.object({
  donorId: objectId
    .required()
    .messages({ 'any.required': 'عطیہ دہندہ ضروری ہے' }),
  date: Joi.date()
    .required()
    .messages({ 'any.required': 'تاریخ ضروری ہے' }),
  category: Joi.string()
    .valid(...DONATION_CATEGORIES)
    .required()
    .messages({
      'any.required': 'قسم ضروری ہے',
      'any.only': 'غلط قسم',
    }),
  amount: Joi.number()
    .min(0.01)
    .required()
    .messages({
      'any.required': 'رقم ضروری ہے',
      'number.min': 'رقم صفر سے زیادہ ہونی چاہیے',
    }),
  paymentMethod: Joi.string()
    .valid(...PAYMENT_METHODS)
    .required()
    .messages({
      'any.required': 'ادائیگی کا طریقہ ضروری ہے',
      'any.only': 'غلط ادائیگی کا طریقہ',
    }),
  bankId: objectId.allow(null, '').optional(),
  remarks: Joi.string().allow('', null).optional(),
});

// Donation update schema (all optional)
export const donationUpdateSchema = Joi.object({
  donorId: objectId.optional(),
  date: Joi.date().optional(),
  category: Joi.string().valid(...DONATION_CATEGORIES).optional(),
  amount: Joi.number().min(0.01).optional(),
  paymentMethod: Joi.string().valid(...PAYMENT_METHODS).optional(),
  bankId: objectId.allow(null, '').optional(),
  remarks: Joi.string().allow('', null).optional(),
}).min(1);

// Expense validation schema (create)
export const expenseSchema = Joi.object({
  date: Joi.date().required().messages({ 'any.required': 'تاریخ ضروری ہے' }),
  category: Joi.string().required().trim().messages({ 'any.required': 'زمرہ ضروری ہے' }),
  description: Joi.string().allow('', null).optional(),
  amount: Joi.number().min(0.01).required().messages({
    'any.required': 'رقم ضروری ہے',
    'number.min': 'رقم صفر سے زیادہ ہونی چاہیے',
  }),
  paymentSource: objectId.required().messages({ 'any.required': 'ادائیگی کا ذریعہ ضروری ہے' }),
});

// Expense update schema
export const expenseUpdateSchema = Joi.object({
  date: Joi.date().optional(),
  category: Joi.string().trim().optional(),
  description: Joi.string().allow('', null).optional(),
  amount: Joi.number().min(0.01).optional(),
  paymentSource: objectId.optional(),
}).min(1);

// Bank validation schema (create)
export const bankSchema = Joi.object({
  bankName: Joi.string().required().trim().messages({
    'string.empty': 'بینک کا نام ضروری ہے',
    'any.required': 'بینک کا نام ضروری ہے',
  }),
  accountName: Joi.string().required().trim().messages({
    'string.empty': 'اکاؤنٹ کا نام ضروری ہے',
    'any.required': 'اکاؤنٹ کا نام ضروری ہے',
  }),
  accountNumber: Joi.string().required().trim().messages({
    'string.empty': 'اکاؤنٹ نمبر ضروری ہے',
    'any.required': 'اکاؤنٹ نمبر ضروری ہے',
  }),
});

// Bank update schema (no balance)
export const bankUpdateSchema = Joi.object({
  bankName: Joi.string().trim().optional(),
  accountName: Joi.string().trim().optional(),
  accountNumber: Joi.string().trim().optional(),
}).min(1);

// Department validation schema (create)
export const departmentSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .required()
    .trim()
    .messages({
      'string.empty': 'نام ضروری ہے',
      'string.min': 'نام کم از کم 2 حروف کا ہونا چاہیے',
      'any.required': 'نام ضروری ہے',
    }),
  code: Joi.string()
    .pattern(/^[A-Z0-9\-]+$/)
    .uppercase()
    .allow('', null)
    .optional()
    .messages({
      'string.pattern.base': 'کوڈ صرف حروف، نمبر اور ڈیش پر مشتمل ہو سکتا ہے',
    }),
  address: Joi.string().allow('', null).optional(),
  phone: Joi.string()
    .pattern(/^[\d\s\-+()]+$/)
    .allow('', null)
    .optional()
    .messages({
      'string.pattern.base': 'غلط فون نمبر کی شکل',
    }),
  email: Joi.string()
    .email()
    .allow('', null)
    .optional()
    .messages({
      'string.email': 'غلط ای میل کی شکل',
    }),
  managerName: Joi.string().allow('', null).optional(),
  managerPhone: Joi.string()
    .pattern(/^[\d\s\-+()]+$/)
    .allow('', null)
    .optional()
    .messages({
      'string.pattern.base': 'غلط فون نمبر کی شکل',
    }),
  description: Joi.string().allow('', null).optional(),
  isActive: Joi.boolean().optional(),
});

// Department update schema (all optional)
export const departmentUpdateSchema = Joi.object({
  name: Joi.string().min(2).trim().optional(),
  code: Joi.string()
    .pattern(/^[A-Z0-9\-]+$/)
    .uppercase()
    .allow('', null)
    .optional()
    .messages({
      'string.pattern.base': 'کوڈ صرف حروف، نمبر اور ڈیش پر مشتمل ہو سکتا ہے',
    }),
  address: Joi.string().allow('', null).optional(),
  phone: Joi.string()
    .pattern(/^[\d\s\-+()]+$/)
    .allow('', null)
    .optional()
    .messages({
      'string.pattern.base': 'غلط فون نمبر کی شکل',
    }),
  email: Joi.string()
    .email()
    .allow('', null)
    .optional()
    .messages({
      'string.email': 'غلط ای میل کی شکل',
    }),
  managerName: Joi.string().allow('', null).optional(),
  managerPhone: Joi.string()
    .pattern(/^[\d\s\-+()]+$/)
    .allow('', null)
    .optional()
    .messages({
      'string.pattern.base': 'غلط فون نمبر کی شکل',
    }),
  description: Joi.string().allow('', null).optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

// Validate request data
export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'غلط معلومات',
        errors,
      });
    }

    req.body = value;
    next();
  };
};
