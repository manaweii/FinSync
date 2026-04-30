import mongoose from 'mongoose';

const SubscriptionSchema = new mongoose.Schema({
  // Organization Details
  orgName: { type: String, required: true },
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  phone: { type: String },

  // Admin Details
  billingEmail: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Payment Details
  amount: { type: Number, required: true },
  planName: { type: String, default: 'Starter' },
  transactionUuid: { type: String, required: true, unique: true  },
  esewaRefId: { type: String }, // Provided by eSewa after success
  
  // Status Management
  status: { 
    type: String, 
    enum: ["Active", "Disabled", "Pending"], 
    default: 'Pending' 
  },
  type: { 
    type: String, 
    enum: ['signup', 'upgrade'], 
    default: 'signup' 
  },
  
  // Dates
  paidAt: { type: Date },
  nextBilling: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const Subscription = mongoose.model('Subscription', SubscriptionSchema);
export default Subscription;
