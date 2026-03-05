import asyncHandler from 'express-async-handler';
import AgronomistProfile from '../models/agronomistProfile.model.js';
import User from '../models/user.model.js';
import Location from '../models/location.model.js';

// --- Get Agronomist Profile ---
export const getProfile = asyncHandler(async (req, res) => {
  const profile = await AgronomistProfile.findOne({ user: req.user.id })
    .populate({
      path: 'user',
      populate: {
        path: 'profilePhoto',
        select: 'url',
      },
    });
  res.json(profile);
});

// --- Update Professional Info ---
export const updateProfile = asyncHandler(async (req, res) => {
  const { qualification, experience, availability, bio, fullName, language, district, taluka } = req.body;
  
  // Update agronomist profile
  const profile = await AgronomistProfile.findOneAndUpdate(
    { user: req.user.id },
    { qualification, experience, availability, bio },
    { new: true }
  ).populate('user');
  
  // Update user details if provided
  if (fullName || language || district || taluka) {
    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (language) updateData.language = language;
    if (district !== undefined || taluka !== undefined) {
      updateData.address = {
        district: district !== undefined ? district : profile.user.address?.district || '',
        taluka: taluka !== undefined ? taluka : profile.user.address?.taluka || '',
      };
    }
    
    await User.findByIdAndUpdate(req.user.id, updateData);
    await profile.populate('user');
  }
  
  res.json(profile);
});

// --- Admin: Verify / Reject Agronomist ---
export const verifyAgronomist = asyncHandler(async (req, res) => {
  const { status } = req.body; // 'verified' or 'rejected'
  const profile = await AgronomistProfile.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate('user');
  res.json(profile);
});

// --- Find Local Experts for Farmer (50 km radius geo search) ---
export const findLocalExperts = asyncHandler(async (req, res) => {
  const farmer = await User.findById(req.user.id);

  // Accept explicit lat/lng from query, else use farmer's stored location
  let lat = parseFloat(req.query.lat);
  let lng = parseFloat(req.query.lng);
  const radiusKm = parseFloat(req.query.radius) || 50; // default 50 km

  if (isNaN(lat) || isNaN(lng)) {
    lat = farmer?.location?.coordinates?.[1];
    lng = farmer?.location?.coordinates?.[0];
  }

  // If we have valid coordinates → geo search
  if (lat && lng && isFinite(lat) && isFinite(lng)) {
    const radiusMeters = radiusKm * 1000;

    // Find users within radius who are agronomists
    const nearbyUsers = await User.find({
      role: 'agronomist',
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: radiusMeters,
        },
      },
    }).select('_id fullName mobileNumber address location profilePhoto')
      .populate({ path: 'profilePhoto', select: 'url' });

    const nearbyUserIds = nearbyUsers.map(u => u._id);

    // Get verified agronomist profiles for those users
    const expertProfiles = await AgronomistProfile.find({
      user: { $in: nearbyUserIds },
      status: 'verified',
    }).populate({
      path: 'user',
      select: 'fullName mobileNumber address location profilePhoto',
      populate: { path: 'profilePhoto', select: 'url' },
    });

    const localExperts = expertProfiles
      .filter(p => p.user)
      .map(profile => {
        // Calculate distance
        const aLat = profile.user.location?.coordinates?.[1];
        const aLng = profile.user.location?.coordinates?.[0];
        let distanceKm = null;
        if (aLat && aLng) {
          const R = 6371;
          const dLat = ((aLat - lat) * Math.PI) / 180;
          const dLng = ((aLng - lng) * Math.PI) / 180;
          const a = Math.sin(dLat / 2) ** 2 +
            Math.cos((lat * Math.PI) / 180) * Math.cos((aLat * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
          distanceKm = +(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
        }
        return {
          id: profile._id,
          fullName: profile.user.fullName,
          mobileNumber: profile.user.mobileNumber,
          district: profile.user.address?.district || '',
          profilePhotoUrl: profile.user.profilePhoto?.url || null,
          qualification: profile.qualification,
          experience: profile.experience,
          location: profile.user.location || null,
          distanceKm,
        };
      })
      .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));

    return res.json({ radiusKm, count: localExperts.length, experts: localExperts });
  }

  // Fallback: district-based match
  if (!farmer || !farmer.address?.district) {
    return res.status(400).json({ message: "Farmer's location or district not found. Please update your location." });
  }
  const farmerDistrict = farmer.address.district.trim().toLowerCase();

  const expertProfiles = await AgronomistProfile.find({ status: 'verified' }).populate({
    path: 'user',
    select: 'fullName mobileNumber address location profilePhoto',
    populate: { path: 'profilePhoto', select: 'url' },
  });

  const localExperts = expertProfiles
    .filter(profile => {
      const agronomistDistrict = profile.user?.address?.district?.trim().toLowerCase();
      return profile.user && agronomistDistrict && agronomistDistrict === farmerDistrict;
    })
    .map(profile => ({
      id: profile._id,
      fullName: profile.user.fullName,
      mobileNumber: profile.user.mobileNumber,
      district: profile.user.address?.district || '',
      profilePhotoUrl: profile.user.profilePhoto?.url || null,
      qualification: profile.qualification,
      experience: profile.experience,
      location: profile.user.location || null,
      distanceKm: null,
    }));

  res.json({ radiusKm: null, count: localExperts.length, experts: localExperts });
});

// --- Find Local Farmers for Agronomist ---
export const findLocalFarmers = asyncHandler(async (req, res) => {
  // 1. Get the logged-in agronomist's district from their profile
  const agronomist = await User.findById(req.user.id);
  if (!agronomist || !agronomist.address?.district) {
    return res.status(400).json({ message: "Agronomist's district not found in profile." });
  }
  const agronomistDistrict = agronomist.address.district.trim().toLowerCase();

  // 2. Find farmers with the same district and populate profile photo
  const farmers = await User.find({
    role: 'farmer',
  })
    .select('fullName mobileNumber address profilePhoto')
    .populate({
      path: 'profilePhoto',
      select: 'url',
    });

  // 3. Filter farmers that share the same district and format response
  const localFarmers = farmers
    .filter(farmer => {
      const farmerDistrict = farmer.address?.district?.trim().toLowerCase();
      return farmerDistrict && farmerDistrict === agronomistDistrict;
    })
    .map(farmer => ({
      id: farmer._id,
      fullName: farmer.fullName,
      mobileNumber: farmer.mobileNumber,
      district: farmer.address?.district || '',
      profilePhotoUrl: farmer.profilePhoto?.url || null,
    }));

  res.json(localFarmers);
});