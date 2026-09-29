import React, { useState } from 'react';
import { X, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { submitFieldObservation } from '../services/api';

export function FieldValidationModal({
  isOpen,
  onClose,
  locationsData,
  currentDistrict,
  currentBlock,
  currentPanchayat,
  onObservationAdded,
  t
}) {
  const [district, setDistrict] = useState(currentDistrict || 'Pune');
  const [block, setBlock] = useState(currentBlock || 'Haveli');
  const [panchayat, setPanchayat] = useState(currentPanchayat || 'Wagholi');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [observedRainfall, setObservedRainfall] = useState('15.0');
  const [rainfallCondition, setRainfallCondition] = useState('Moderate continuous showers');
  const [cropCondition, setCropCondition] = useState('Pre-sowing tillage & field prep underway');
  const [remarks, setRemarks] = useState('');
  const [officerName, setOfficerName] = useState('Dr. A. B. Joshi (Taluka Agriculture Officer)');
  const [hasPhoto, setHasPhoto] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMsg('');

    try {
      const payload = {
        district,
        block,
        panchayat,
        date,
        observed_rainfall_mm: parseFloat(observedRainfall) || 0.0,
        rainfall_condition: rainfallCondition,
        crop_condition: cropCondition,
        remarks: remarks || 'Field verification conducted against local rain gauge.',
        officer_name: officerName,
        has_photo: hasPhoto
      };

      const res = await submitFieldObservation(payload);
      if (res.success) {
        setStatusMsg('Observation successfully logged in ground-truth database!');
        setTimeout(() => {
          onObservationAdded();
          onClose();
        }, 1200);
      }
    } catch (err) {
      console.error(err);
      setStatusMsg('Error submitting observation. Please check API status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border-2 border-agri-secondary rounded-md shadow-xl max-w-lg w-full overflow-hidden">
        {/* Modal Header */}
        <div className="bg-agri-secondary text-white px-4 py-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold tracking-wide uppercase">
              Field Validation & Ground Observation Report
            </h3>
            <span className="text-[11px] text-slate-300">
              Department of Agriculture • Taluka Officer Portal
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs">
          {statusMsg && (
            <div className={`p-2.5 rounded font-medium flex items-center gap-2 ${
              statusMsg.includes('Error') ? 'bg-red-50 text-red-800 border border-red-300' : 'bg-emerald-50 text-emerald-800 border border-emerald-300'
            }`}>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          {/* Location details */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">District</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full border border-slate-300 rounded p-1.5 font-medium bg-slate-50"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Block / Taluka</label>
              <input
                type="text"
                value={block}
                onChange={(e) => setBlock(e.target.value)}
                className="w-full border border-slate-300 rounded p-1.5 font-medium bg-slate-50"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Panchayat / Village</label>
              <input
                type="text"
                value={panchayat}
                onChange={(e) => setPanchayat(e.target.value)}
                className="w-full border border-slate-300 rounded p-1.5 font-medium bg-slate-50"
                required
              />
            </div>
          </div>

          {/* Date & Observed Rainfall */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Observation Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-slate-300 rounded p-1.5 font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Observed Rainfall (mm)</label>
              <input
                type="number"
                step="0.1"
                value={observedRainfall}
                onChange={(e) => setObservedRainfall(e.target.value)}
                className="w-full border border-slate-300 rounded p-1.5 font-bold text-slate-900"
                required
              />
            </div>
          </div>

          {/* Observed Rain Condition */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Observed Rain / Spring Condition</label>
            <select
              value={rainfallCondition}
              onChange={(e) => setRainfallCondition(e.target.value)}
              className="w-full border border-slate-300 rounded p-1.5 font-medium text-slate-800"
            >
              <option value="Dry spell / overcast sky">Dry spell / overcast sky</option>
              <option value="Light scattered drizzle (1-5mm)">Light scattered drizzle (1-5mm)</option>
              <option value="Moderate continuous showers (15-30mm)">Moderate continuous showers (15-30mm)</option>
              <option value="Heavy convective cloudburst (>50mm)">Heavy convective cloudburst (&gt;50mm)</option>
              <option value="Waterlogged fields / runoff active">Waterlogged fields / runoff active</option>
            </select>
          </div>

          {/* Crop Condition */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Ground Crop & Soil Condition</label>
            <select
              value={cropCondition}
              onChange={(e) => setCropCondition(e.target.value)}
              className="w-full border border-slate-300 rounded p-1.5 font-medium text-slate-800"
            >
              <option value="Pre-sowing tillage & field prep underway">Pre-sowing tillage & field prep underway</option>
              <option value="Active sowing initiated across village">Active sowing initiated across village</option>
              <option value="Seedling germination healthy (sufficient moisture)">Seedling germination healthy (sufficient moisture)</option>
              <option value="Moisture stress observed due to delayed rain">Moisture stress observed due to delayed rain</option>
              <option value="Standing water / nursery bed protection required">Standing water / nursery bed protection required</option>
            </select>
          </div>

          {/* Field Remarks */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Field Remarks / Officer Assessment</label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Sowing advised in lighter soils; black cotton soils still require 20mm additional rain."
              className="w-full border border-slate-300 rounded p-1.5 text-slate-800"
            />
          </div>

          {/* Officer Name & Photo Placeholder */}
          <div className="grid grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Reporting Officer</label>
              <input
                type="text"
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                className="w-full border border-slate-300 rounded p-1.5 font-medium"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Geo-Tagged Field Photo</label>
              <label className="flex items-center gap-2 border border-dashed border-slate-300 rounded p-1.5 bg-slate-50 cursor-pointer hover:bg-slate-100">
                <Upload className="w-4 h-4 text-agri-secondary" />
                <span className="text-[11px] text-slate-600">
                  {hasPhoto ? 'gauge_reading_wagholi.jpg attached' : 'Upload photo'}
                </span>
                <input
                  type="checkbox"
                  checked={hasPhoto}
                  onChange={(e) => setHasPhoto(e.target.checked)}
                  className="ml-auto"
                />
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded bg-agri-secondary hover:bg-agri-secondaryLight text-white font-bold transition flex items-center gap-1.5"
            >
              {isSubmitting ? 'Logging...' : 'Submit Ground Observation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
