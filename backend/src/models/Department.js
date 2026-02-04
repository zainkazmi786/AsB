import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'نام ضروری ہے'],
    unique: true,
    trim: true,
    minlength: [2, 'نام کم از کم 2 حروف کا ہونا چاہیے'],
  },
  code: {
    type: String,
    trim: true,
    sparse: true, // Allow multiple nulls but enforce uniqueness for non-null values
    uppercase: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        return /^[A-Z0-9\-]+$/.test(v);
      },
      message: 'کوڈ صرف حروف، نمبر اور ڈیش پر مشتمل ہو سکتا ہے',
    },
  },
  address: {
    type: String,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        return /^[\d\s\-+()]+$/.test(v);
      },
      message: 'غلط فون نمبر کی شکل',
    },
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true, // Allow multiple nulls but enforce uniqueness for non-null values
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'غلط ای میل کی شکل',
    },
  },
  managerName: {
    type: String,
    trim: true,
  },
  managerPhone: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        return /^[\d\s\-+()]+$/.test(v);
      },
      message: 'غلط فون نمبر کی شکل',
    },
  },
  description: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Indexes for search and filtering
departmentSchema.index({ name: 'text', code: 'text' });
departmentSchema.index({ isDeleted: 1 });
departmentSchema.index({ isActive: 1 });
departmentSchema.index({ code: 1 }, { unique: true, sparse: true });

// Exclude deleted departments by default
departmentSchema.pre(/^find/, function() {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
});

// Static method to generate next department code
departmentSchema.statics.generateNextCode = async function() {
  const prefix = 'DEPT-';
  
  // Find max sequence (code like "DEPT-001")
  const lastDept = await this.findOne({
    code: new RegExp(`^${prefix}\\d+$`),
    isDeleted: { $ne: true },
  })
    .sort({ code: -1 })
    .select('code')
    .lean();

  let nextSeq = 1;
  if (lastDept && lastDept.code) {
    const match = lastDept.code.match(/-(\d+)$/);
    if (match) {
      nextSeq = parseInt(match[1], 10) + 1;
    }
  }

  const numberPart = String(nextSeq).padStart(3, '0');
  return `${prefix}${numberPart}`;
};

const Department = mongoose.model('Department', departmentSchema);

export default Department;
