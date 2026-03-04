import mongoose from 'mongoose';

const farmProfileSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        state: { type: String, trim: true },
        district: { type: String, trim: true },
        crops: [{ type: String, trim: true }],          // e.g. ['Wheat', 'Banana']
        landSize: { type: Number },                      // in acres
        landUnit: { type: String, default: 'acres', enum: ['acres', 'hectares', 'guntha'] },
        farmerCategory: {
            type: String,
            enum: ['marginal', 'small', 'medium', 'large'],
            default: 'small',
        },
        irrigationType: {
            type: String,
            enum: ['rainfed', 'canal', 'drip', 'sprinkler', 'borewell', 'mixed'],
            default: 'rainfed',
        },
        isOrganicFarm: { type: Boolean, default: false },
        hasSoilHealthCard: { type: Boolean, default: false },
        hasKisanCreditCard: { type: Boolean, default: false },
        annualIncome: { type: Number },                  // INR
        bankAccountLinked: { type: Boolean, default: true },
        aadhaarLinked: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const FarmProfile = mongoose.model('FarmProfile', farmProfileSchema);
export default FarmProfile;
