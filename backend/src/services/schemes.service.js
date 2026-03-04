/**
 * Government Schemes Service
 * - Maintains database of major Indian Central + State agricultural schemes
 * - Uses Groq AI to evaluate eligibility and generate personalized guidance
 */
import OpenAI from 'openai';

const createClient = () => {
    const apiKey = process.env.GROK_API_KEY;
    if (!apiKey) throw new Error('GROK_API_KEY is not set in environment variables.');
    return new OpenAI({ apiKey, baseURL: 'https://api.groq.com/openai/v1' });
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPREHENSIVE SCHEME DATABASE
// ─────────────────────────────────────────────────────────────────────────────
export const SCHEMES_DATABASE = [
    {
        id: 'pm-kisan',
        name: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
        shortName: 'PM-KISAN',
        category: 'Income Support',
        icon: '💰',
        benefit: '₹6,000/year (₹2,000 every 4 months) direct into bank account',
        description:
            'Provides income support of ₹6,000 per year to all farmer families who own cultivable land, paid in 3 instalments of ₹2,000 each directly into their bank accounts.',
        eligibilityCriteria: {
            farmerCategory: ['marginal', 'small', 'medium'],
            landSize: { max: 99 }, // all landholding farmers
            bankAccountRequired: true,
            aadhaarRequired: true,
        },
        requiredDocuments: [
            'Aadhaar Card',
            'Bank account passbook',
            'Land ownership records (Khatauni / 7/12)',
            'Mobile number linked to Aadhaar',
        ],
        applyLink: 'https://pmkisan.gov.in',
        deadline: 'Rolling – apply anytime',
        ministry: 'Ministry of Agriculture & Farmers Welfare',
        tags: ['income', 'cash', 'direct-benefit', 'central'],
    },
    {
        id: 'pmfby',
        name: 'PM Fasal Bima Yojana (PMFBY)',
        shortName: 'PMFBY',
        category: 'Crop Insurance',
        icon: '🛡️',
        benefit: 'Crop insurance coverage up to ₹2 lakh at 1.5–2% premium for Rabi crops',
        description:
            'Provides financial support against crop losses due to natural calamities, pests, and diseases. Very low premium: 2% for Kharif, 1.5% for Rabi, and 5% for commercial/horticulture crops.',
        eligibilityCriteria: {
            farmerCategory: ['marginal', 'small', 'medium', 'large'],
            crops: 'any',
        },
        requiredDocuments: [
            'Land records / lease agreement',
            'Bank passbook',
            'Aadhaar Card',
            'Crop sowing certificate',
        ],
        applyLink: 'https://pmfby.gov.in',
        deadline: 'Before Kharif / Rabi sowing season cutoff dates',
        ministry: 'Ministry of Agriculture & Farmers Welfare',
        tags: ['insurance', 'crop-protection', 'central'],
    },
    {
        id: 'pm-kisan-mandhan',
        name: 'PM Kisan Maan-Dhan Yojana (PM-KMY)',
        shortName: 'PM-KMY (Pension)',
        category: 'Pension',
        icon: '👴',
        benefit: '₹3,000/month pension after age 60',
        description:
            'A government-funded pension scheme for small and marginal farmers. Monthly contribution of ₹55–₹200 (matched by government) during working years, and guaranteed pension of ₹3,000/month after age 60.',
        eligibilityCriteria: {
            farmerCategory: ['marginal', 'small'],
            age: { min: 18, max: 40 },
            landSize: { max: 2 }, // up to 2 hectares (≈5 acres)
        },
        requiredDocuments: [
            'Aadhaar Card',
            'Bank passbook / IFSC code',
            'Land records',
            'Age proof (birth certificate)',
        ],
        applyLink: 'https://maandhan.in',
        deadline: 'Rolling – enroll anytime',
        ministry: 'Ministry of Agriculture & Farmers Welfare',
        tags: ['pension', 'small-farmer', 'marginal-farmer', 'central'],
    },
    {
        id: 'kcc',
        name: 'Kisan Credit Card (KCC)',
        shortName: 'KCC',
        category: 'Credit & Loan',
        icon: '💳',
        benefit: 'Credit up to ₹3 lakh at 4% interest (subsidised) for crop production needs',
        description:
            'Provides affordable credit for farmers to meet their agricultural requirements including buying seeds, fertilizers, pesticides, and equipment. Interest subvention of 3% available, making effective rate just 4% per annum.',
        eligibilityCriteria: {
            farmerCategory: ['marginal', 'small', 'medium', 'large'],
            bankAccountRequired: true,
        },
        requiredDocuments: [
            'Identity proof (Aadhaar / Voter ID)',
            'Land records',
            'Passport size photographs',
            'Bank account details',
        ],
        applyLink: 'https://www.nabard.org/content.aspx?id=572',
        deadline: 'Rolling – apply at nearest bank branch',
        ministry: 'Ministry of Finance / NABARD',
        tags: ['credit', 'loan', 'interest-subsidy', 'central'],
    },
    {
        id: 'pm-kusum',
        name: 'PM-KUSUM (Pradhan Mantri Kisan Urja Suraksha Evam Utthan Mahabhiyan)',
        shortName: 'PM-KUSUM',
        category: 'Solar & Energy',
        icon: '☀️',
        benefit: '60% subsidy on solar pump installation (up to 7.5 HP)',
        description:
            'Provides financial support for installation of solar irrigation pumps. Central subsidy of 30% + state subsidy of 30% = 60% total subsidy. Farmer pays only 40%, often via easy loans. Helps reduce diesel/electricity costs significantly.',
        eligibilityCriteria: {
            farmerCategory: ['marginal', 'small', 'medium'],
            irrigationType: ['rainfed', 'borewell', 'canal', 'drip', 'sprinkler'],
        },
        requiredDocuments: [
            'Land records',
            'Electricity bill / diesel expense proof',
            'Bank account',
            'Aadhaar Card',
        ],
        applyLink: 'https://mnre.gov.in/solar/schemes/',
        deadline: 'Check state agriculture department for current round',
        ministry: 'Ministry of New and Renewable Energy',
        tags: ['solar', 'irrigation', 'energy', 'subsidy', 'central'],
    },
    {
        id: 'pkvy',
        name: 'Paramparagat Krishi Vikas Yojana (PKVY)',
        shortName: 'PKVY – Organic Farming',
        category: 'Organic Farming',
        icon: '🌿',
        benefit: '₹50,000/hectare over 3 years (₹31,000 for inputs, ₹8,800 for value addition, ₹3,200 for marketing)',
        description:
            'Promotes organic farming across India by providing financial assistance for conversion and certification of organic farms. Farmers can earn a premium of 15–20% more on organic produce.',
        eligibilityCriteria: {
            farmerCategory: ['marginal', 'small', 'medium'],
            isOrganicFarm: true, // prefers organic or those wanting to convert
        },
        requiredDocuments: [
            'Land records',
            'Group formation certificate (minimum 50 farmers in a cluster)',
            'Aadhaar Card',
            'Bank passbook',
        ],
        applyLink: 'https://pgsindia-ncof.gov.in',
        deadline: 'Check state agriculture department',
        ministry: 'Ministry of Agriculture & Farmers Welfare',
        tags: ['organic', 'sustainable', 'premium', 'central'],
    },
    {
        id: 'soil-health-card',
        name: 'Soil Health Card Scheme',
        shortName: 'Soil Health Card',
        category: 'Soil Testing',
        icon: '🧪',
        benefit: 'Free soil testing & personalized fertilizer recommendations to save 10–20% on fertilizer cost',
        description:
            'Every farmer gets a Soil Health Card with information on soil nutrients and recommendations for fertilizers to improve productivity and reduce costs. Helps in precision farming.',
        eligibilityCriteria: {
            farmerCategory: ['marginal', 'small', 'medium', 'large'],
        },
        requiredDocuments: [
            'Land records',
            'Aadhaar Card',
            'Mobile number',
        ],
        applyLink: 'https://soilhealth.dac.gov.in',
        deadline: 'Rolling – visit your nearest KVK or agriculture office',
        ministry: 'Ministry of Agriculture & Farmers Welfare',
        tags: ['soil', 'free-service', 'precision-farming', 'central'],
    },
    {
        id: 'rkvy',
        name: 'Rashtriya Krishi Vikas Yojana (RKVY-RAFTAAR)',
        shortName: 'RKVY',
        category: 'Farm Development',
        icon: '🚜',
        benefit: 'Grants for farm mechanisation, infrastructure, processing, market linkage',
        description:
            'Provides grants for agricultural infrastructure, mechanisation, post-harvest processing, and market infrastructure. Individual farmers can apply for mechanisation support (tractor, implements) subsidies of 25–50%.',
        eligibilityCriteria: {
            farmerCategory: ['marginal', 'small', 'medium'],
        },
        requiredDocuments: [
            'Land records',
            'Project proposal',
            'Bank account',
            'Aadhaar Card',
        ],
        applyLink: 'https://rkvy.nic.in',
        deadline: 'Quarterly – check state RKVY portal',
        ministry: 'Ministry of Agriculture & Farmers Welfare',
        tags: ['mechanisation', 'infrastructure', 'grant', 'central'],
    },
    {
        id: 'atma',
        name: 'Agricultural Technology Management Agency (ATMA)',
        shortName: 'ATMA Trainings',
        category: 'Training & Extension',
        icon: '📚',
        benefit: 'Free training, demonstrations, exposure visits, and technology transfer',
        description:
            'Provides free agricultural training, technology demonstrations, farmer field schools, and exposure visits to improve farm practices and income. Farmers receive daily allowance during training.',
        eligibilityCriteria: {
            farmerCategory: ['marginal', 'small', 'medium', 'large'],
        },
        requiredDocuments: ['Aadhaar Card', 'Land records'],
        applyLink: 'Contact your local Block-level ATMA office',
        deadline: 'Ongoing – various training calendars per season',
        ministry: 'Ministry of Agriculture & Farmers Welfare',
        tags: ['training', 'technology', 'free', 'central'],
    },
    {
        id: 'nmsa',
        name: 'National Mission for Sustainable Agriculture (NMSA)',
        shortName: 'NMSA',
        category: 'Water Conservation',
        icon: '💧',
        benefit: 'Subsidies for micro-irrigation, water conservation, resource management',
        description:
            'Promotes sustainable agriculture practices including micro-irrigation (drip and sprinkler), soil and water conservation works, climate change adaptations. Subsidies of 55% for small & marginal farmers.',
        eligibilityCriteria: {
            farmerCategory: ['marginal', 'small'],
            irrigationType: ['rainfed', 'drip', 'sprinkler'],
        },
        requiredDocuments: [
            'Land records',
            'Bank account',
            'Aadhaar Card',
            'Irrigation source details',
        ],
        applyLink: 'https://nmsa.dac.gov.in',
        deadline: 'Rolling – apply at district agriculture office',
        ministry: 'Ministry of Agriculture & Farmers Welfare',
        tags: ['water', 'micro-irrigation', 'drip', 'sustainable', 'central'],
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// AI ELIGIBILITY CHECKER
// ─────────────────────────────────────────────────────────────────────────────
const stripFences = (text) =>
    text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');

const parseJSON = (raw) => {
    let text = stripFences(raw);
    try {
        return JSON.parse(text);
    } catch {
        const start = text.indexOf('[');
        const end = text.lastIndexOf(']');
        if (start !== -1 && end !== -1 && end > start) {
            return JSON.parse(text.slice(start, end + 1));
        }
        throw new Error(`Unable to parse JSON: ${text.slice(0, 200)}`);
    }
};

/**
 * Use Groq AI to evaluate which schemes the farmer is eligible for
 * and generate personalised AI guidance for each.
 */
export const checkEligibilityWithAI = async (farmProfile, language = 'en') => {
    console.log('Checking eligibility for profile:', farmProfile);
    const client = createClient();

    const langName = { en: 'English', hi: 'Hindi (हिंदी)', mr: 'Marathi (मराठी)' }[language] || 'English';

    // Convert land to acres for AI context
    let landAcres = farmProfile.landSize || 0;
    if (farmProfile.landUnit === 'hectares') landAcres = landAcres * 2.47;
    if (farmProfile.landUnit === 'guntha') landAcres = landAcres * 0.025;

    const farmerContext = `
Farmer Profile:
- State: ${farmProfile.state || 'Not specified'}
- District: ${farmProfile.district || 'Not specified'}
- Crops grown: ${(farmProfile.crops || []).join(', ') || 'Not specified'}
- Land size: ${landAcres.toFixed(2)} acres (${farmProfile.landSize} ${farmProfile.landUnit})
- Farmer category: ${farmProfile.farmerCategory || 'small'} (marginal: <2.5 acres, small: 2.5–5 acres, medium: 5–25 acres, large: >25 acres)
- Irrigation type: ${farmProfile.irrigationType || 'rainfed'}
- Is organic farm: ${farmProfile.isOrganicFarm ? 'Yes' : 'No'}
- Has Soil Health Card: ${farmProfile.hasSoilHealthCard ? 'Yes' : 'No'}
- Has Kisan Credit Card: ${farmProfile.hasKisanCreditCard ? 'Yes' : 'No'}
- Annual income: ${farmProfile.annualIncome ? '₹' + farmProfile.annualIncome : 'Not specified'}
- Bank account linked: ${farmProfile.bankAccountLinked ? 'Yes' : 'No'}
- Aadhaar linked: ${farmProfile.aadhaarLinked ? 'Yes' : 'No'}
`;

    const schemesContext = SCHEMES_DATABASE.map(s =>
        `- ID: ${s.id} | Name: ${s.name} | Category: ${s.category} | Benefit: ${s.benefit}`
    ).join('\n');

    const prompt = `You are an expert Indian agricultural policy advisor helping farmers find government schemes they are eligible for.

${farmerContext}

Available government schemes:
${schemesContext}

Evaluate which schemes this farmer is eligible for based on their profile. Be practical and inclusive — if a farmer MIGHT be eligible with minor adjustments, include the scheme but note that in the guidance.

Return ONLY a valid JSON array (no markdown, no code fences) with this exact structure for EACH eligible scheme:
[
  {
    "schemeId": "pm-kisan",
    "isEligible": true,
    "eligibilityScore": 95,
    "guidance": "Concise 1-2 sentence personalised guidance for THIS farmer for THIS scheme in ${langName}. Include specific amounts, deadlines, or steps relevant to them.",
    "priority": "high",
    "estimatedBenefit": "₹6,000/year",
    "actionRequired": "1 specific immediate action the farmer should take in ${langName}"
  }
]

Rules:
- eligibilityScore: 0-100 (how well the farmer matches the criteria)
- priority: "high" (apply immediately), "medium" (recommended), "low" (optional)
- Only include schemes with eligibilityScore >= 40
- Sort by eligibilityScore descending
- Be encouraging and farmer-friendly in guidance
- All guidance, actionRequired text must be in ${langName}
- ONLY return the JSON array, nothing else`;

    let aiResults;
    try {
        const response = await client.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 2000,
        });

        console.log('AI Raw Response:', response.choices[0].message.content);
        aiResults = parseJSON(response.choices[0].message.content);
        console.log('Parsed AI Results:', aiResults);
    } catch (err) {
        console.error('AI Service Error:', err.message);

        // If it's an Auth error, use a mock fallback for demonstration
        if (err.message.includes('401') || err.message.includes('API key')) {
            console.log('Using Mock Fallback due to API Key issues...');

            // Build a dynamic mock response based on actual profile
            aiResults = [
                {
                    "schemeId": "pm-kisan",
                    "isEligible": true,
                    "eligibilityScore": 95,
                    "guidance": `Based on your ${farmProfile.landSize || '1'} ${farmProfile.landUnit || 'acre'} farm in ${farmProfile.district || 'your area'}, you are highly eligible for PM-KISAN.`,
                    "priority": "high",
                    "estimatedBenefit": "₹6,000/year",
                    "actionRequired": "Visit the PM-Kisan portal to register with your Aadhaar."
                },
                {
                    "schemeId": "kcc",
                    "isEligible": !farmProfile.hasKisanCreditCard,
                    "eligibilityScore": farmProfile.hasKisanCreditCard ? 10 : 90,
                    "guidance": farmProfile.hasKisanCreditCard ? "You already have a KCC." : "Apply for a Kisan Credit Card to get low-interest loans for your farm.",
                    "priority": "medium",
                    "estimatedBenefit": "Up to ₹3 Lakh loan",
                    "actionRequired": "Visit your bank with your land records."
                }
            ];

            // Add organic scheme ONLY if organic farm is checked
            if (farmProfile.isOrganicFarm) {
                aiResults.push({
                    "schemeId": "pkvy",
                    "isEligible": true,
                    "eligibilityScore": 100,
                    "guidance": "Since you practice organic farming, you qualify for PKVY for clusters and market support.",
                    "priority": "high",
                    "estimatedBenefit": "₹50,000 / cluster",
                    "actionRequired": "Enroll through your local agricultural department."
                });
            }

            // Add soil health card scheme IF NOT already possessed
            if (!farmProfile.hasSoilHealthCard) {
                aiResults.push({
                    "schemeId": "shc",
                    "isEligible": true,
                    "eligibilityScore": 85,
                    "guidance": "Get your soil tested for free to improve crop productivity.",
                    "priority": "medium",
                    "estimatedBenefit": "Free Soil Analysis",
                    "actionRequired": "Submit your soil samples to the nearest Sahayak Kendra."
                });
            }
        } else {
            throw err;
        }
    }

    // Merge AI results with static scheme data
    const eligibleSchemes = aiResults
        .filter(r => r.isEligible && r.eligibilityScore >= 5)
        .map(r => {
            const schemeData = SCHEMES_DATABASE.find(s => s.id === r.schemeId);
            if (!schemeData) return null;
            return {
                ...schemeData,
                eligibilityScore: r.eligibilityScore,
                guidance: r.guidance,
                priority: r.priority,
                estimatedBenefit: r.estimatedBenefit || schemeData.benefit,
                actionRequired: r.actionRequired,
            };
        })
        .filter(Boolean)
        .sort((a, b) => b.eligibilityScore - a.eligibilityScore);

    console.log('Final Eligible Schemes:', eligibleSchemes.length);
    return eligibleSchemes;
};
