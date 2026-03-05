/**
 * controllers/market.controller.js
 * Handles all /api/v1/market routes.
 */

import {
    runScrapeCycle,
    searchMarketPrices,
    getLatestByDistrict,
    getCommodityPriceHistory,
    predictPrices,
    getDistinctFilterValues,
    getMarketStats,
    getLatestPricesForCrops,
} from '../services/market.service.js';
import Crop from '../models/crop.model.js';
import Location from '../models/location.model.js';
import MarketPrice from '../models/marketPrice.model.js';

// ── POST /market/scrape ───────────────────────────────────────────────────────
/** Manually trigger the scrape cycle (farmer or admin) */
export const triggerScrape = async (req, res) => {
    try {
        const result = await runScrapeCycle();
        res.json({
            success: true,
            message: `Scrape cycle complete. Saved ${result.saved} new price records.`,
            ...result,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── GET /market/latest?commodity=Soybean&state=Maharashtra ───────────────────
/** Latest price per district for a given commodity */
export const getLatestPrices = async (req, res) => {
    try {
        const { commodity, state } = req.query;
        if (!commodity) return res.status(400).json({ success: false, message: 'commodity query param required' });

        const rows = await getLatestByDistrict(commodity, state);
        res.json({ success: true, commodity, state: state || 'All', count: rows.length, results: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── GET /market/search ────────────────────────────────────────────────────────
export const searchPrices = async (req, res) => {
    try {
        const {
            commodity, state, district,
            startDate, endDate,
            page = 1, limit = 48,
        } = req.query;

        const data = await searchMarketPrices({
            commodity, state, district, startDate, endDate,
            page: parseInt(page),
            limit: Math.min(parseInt(limit), 200),
        });
        res.json({ success: true, ...data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── GET /market/history/:commodity ────────────────────────────────────────────
export const getPriceHistory = async (req, res) => {
    try {
        const { commodity } = req.params;
        const { state, district } = req.query;
        const history = await getCommodityPriceHistory(commodity, { state, district });
        res.json({ success: true, commodity, count: history.length, history });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── GET /market/predict/:commodity ────────────────────────────────────────────
export const getPricePrediction = async (req, res) => {
    try {
        const { commodity } = req.params;
        const { district } = req.query;
        const result = await predictPrices(commodity, district);
        res.json({ success: true, ...result });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── GET /market/my-crops ──────────────────────────────────────────────────────
export const getMyCropPrices = async (req, res) => {
    try {
        const crops = await Crop.find({ farmer: req.user._id }).lean();
        const cropNames = [...new Set(crops.map((c) => c.cropName))];
        if (!cropNames.length) {
            return res.json({ success: true, prices: [], message: 'No crops in your list.' });
        }
        const prices = await getLatestPricesForCrops(cropNames);
        res.json({ success: true, cropNames, prices });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── GET /market/filters ───────────────────────────────────────────────────────
export const getFilters = async (req, res) => {
    try {
        const filters = await getDistinctFilterValues();
        res.json({ success: true, ...filters });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── GET /market/stats ─────────────────────────────────────────────────────────
export const getMarketStatsCtrl = async (req, res) => {
    try {
        const stats = await getMarketStats();
        res.json({ success: true, ...stats });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── GET /market/nearby?lat=&lng=&radius=50 ────────────────────────────────────
/** Find market-price districts within a radius (km) of given coordinates.
 *  Uses the Location model (which has a 2dsphere index on `geo`) to map
 *  geo-coordinates → district names, then fetches latest MarketPrice records
 *  for those districts.  Radius is adjustable (default 50 km). */
export const getNearbyMarketPrices = async (req, res) => {
    try {
        const lat = parseFloat(req.query.lat);
        const lng = parseFloat(req.query.lng);
        const radiusKm = Math.min(parseFloat(req.query.radius) || 50, 500); // cap 500 km
        const commodity = req.query.commodity || null;

        if (isNaN(lat) || isNaN(lng))
            return res.status(400).json({ success: false, message: 'lat and lng query params are required' });

        const radiusMeters = radiusKm * 1000;

        // 1. Find Location docs within radius
        const nearbyLocations = await Location.find({
            geo: {
                $near: {
                    $geometry: { type: 'Point', coordinates: [lng, lat] },
                    $maxDistance: radiusMeters,
                },
            },
        }).lean();

        // 2. Collect unique district names
        const districtNames = [...new Set(nearbyLocations.map(l => l.district))];

        if (!districtNames.length) {
            return res.json({
                success: true, radiusKm, count: 0, districts: [],
                results: [], message: 'No known market locations within the specified radius.',
            });
        }

        // 3. Build query for market prices in those districts
        const priceQuery = {
            district: { $in: districtNames.map(d => new RegExp(d, 'i')) },
        };
        if (commodity) priceQuery.commodity = { $regex: commodity, $options: 'i' };

        const prices = await MarketPrice.find(priceQuery)
            .sort({ publishDate: -1 })
            .limit(200)
            .lean();

        // 4. Attach distance info to each location
        const locationsWithDistance = nearbyLocations.map(loc => {
            const lLat = loc.geo?.coordinates?.[1];
            const lLng = loc.geo?.coordinates?.[0];
            let distanceKm = null;
            if (lLat && lLng) {
                const R = 6371;
                const dLat = ((lLat - lat) * Math.PI) / 180;
                const dLng = ((lLng - lng) * Math.PI) / 180;
                const a = Math.sin(dLat / 2) ** 2 +
                    Math.cos((lat * Math.PI) / 180) * Math.cos((lLat * Math.PI) / 180) *
                    Math.sin(dLng / 2) ** 2;
                distanceKm = +(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
            }
            return { ...loc, distanceKm };
        }).sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));

        res.json({
            success: true,
            radiusKm,
            count: prices.length,
            districts: districtNames,
            locations: locationsWithDistance,
            results: prices,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
