import { useState, useEffect } from 'react';
import { adminAPI, agronomistAPI } from '../../services/api';

const Agronomists = () => {
  const [agronomists, setAgronomists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [viewingDocument, setViewingDocument] = useState(null);
  const [zoom, setZoom] = useState(1);

  const handleZoom = (delta) => {
    setZoom(prev => Math.min(Math.max(prev + delta, 0.5), 3));
  };

  useEffect(() => {
    fetchAgronomists();
  }, []);

  const fetchAgronomists = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.listAgronomists();
      setAgronomists(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch agronomists');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (profileId, status) => {
    try {
      setStatusUpdating(profileId + status);
      await agronomistAPI.verifyAgronomist(profileId, status);
      await fetchAgronomists();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update agronomist status');
    } finally {
      setStatusUpdating(null);
    }
  };

  const handleDelete = async (userId) => {
    if (!userId) {
      setError('Agronomist account missing user reference.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this agronomist account?')) return;
    try {
      setDeletingId(userId);
      await adminAPI.deleteAgronomist(userId);
      await fetchAgronomists();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete agronomist');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      verified: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
    };
    return badges[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-500/20 border border-blue-500/30 rounded-2xl flex items-center justify-center text-3xl">🔬</div>
            <div>
              <h1 className="text-3xl font-extrabold text-white">Agronomists Management</h1>
              <p className="text-gray-400 text-sm mt-0.5">Verify, approve, and manage all agronomist accounts</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-2xl text-sm flex items-center gap-2">
            ⚠️ <span>{error}</span>
          </div>
        )}

        {/* Table Card */}
        <div className="bg-white/5 border border-white/10 backdrop-blur rounded-3xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600/80 to-indigo-700/80 px-6 py-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-white flex items-center gap-3">
                <span>🔬</span>
                <span>All Agronomists</span>
                <span className="text-sm bg-white/20 px-2 py-0.5 rounded-full font-bold">{agronomists.length}</span>
              </h2>
              <button onClick={fetchAgronomists}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold transition-colors flex items-center gap-2 text-sm">
                🔄 Refresh
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {agronomists.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔬</div>
                <p className="text-gray-400 font-semibold text-lg">No agronomists registered yet.</p>
              </div>
            ) : (
              <table className="min-w-full">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    {['Name', 'Mobile', 'Qualification', 'Experience', 'Status', 'ID Proof', 'Actions'].map(h => (
                      <th key={h} className={`px-5 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider ${h === 'Actions' ? 'text-right' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {agronomists.map((agronomist) => (
                    <tr key={agronomist._id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-extrabold shadow">
                            {(agronomist.user?.fullName || agronomist.fullName)?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-bold text-white">
                            {agronomist.user?.fullName || agronomist.fullName}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-400">📞 {agronomist.user?.mobileNumber || agronomist.mobileNumber}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-400">{agronomist.qualification || <span className="text-gray-600">—</span>}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-400">{agronomist.experience || 0} yrs</td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs font-bold rounded-full border ${agronomist.status === 'verified' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                          agronomist.status === 'rejected' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                            'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          }`}>
                          {agronomist.status === 'verified' ? '✓' : agronomist.status === 'rejected' ? '✗' : '⏳'} {agronomist.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm">
                        {agronomist.idProof?.url ? (
                          <button onClick={() => { setViewingDocument(agronomist.idProof); setZoom(1); }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-xl font-semibold transition-colors text-xs">
                            👁️ {agronomist.idProof?.contentType === 'application/pdf' ? 'View PDF' : 'View Image'}
                          </button>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {agronomist.status !== 'verified' && (
                            <button onClick={() => handleStatusChange(agronomist._id, 'verified')}
                              disabled={statusUpdating === agronomist._id + 'verified'}
                              className="inline-flex items-center gap-1 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold transition-colors disabled:opacity-50 text-xs">
                              {statusUpdating === agronomist._id + 'verified' ? '…' : '✓ Approve'}
                            </button>
                          )}
                          {agronomist.status !== 'rejected' && (
                            <button onClick={() => handleStatusChange(agronomist._id, 'rejected')}
                              disabled={statusUpdating === agronomist._id + 'rejected'}
                              className="inline-flex items-center gap-1 px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 rounded-xl font-bold transition-colors disabled:opacity-50 text-xs">
                              {statusUpdating === agronomist._id + 'rejected' ? '…' : '✗ Reject'}
                            </button>
                          )}
                          <button onClick={() => handleDelete(agronomist.user?._id)}
                            disabled={deletingId === agronomist.user?._id}
                            className="inline-flex items-center gap-1 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-xl font-bold transition-colors disabled:opacity-50 text-xs">
                            {deletingId === agronomist.user?._id ? '…' : '🗑️'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Document Viewer Modal */}
      {viewingDocument && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[9999] p-4" onClick={() => setViewingDocument(null)}>
          <div className="bg-slate-900 border border-white/10 rounded-[32px] max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-slate-800/50 px-8 py-6 flex justify-between items-center border-b border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-xl border border-blue-500/30">
                  {viewingDocument.contentType?.includes('pdf') ? '📄' : '🖼️'}
                </div>
                <div>
                  <h3 className="text-white font-black tracking-tight text-lg">
                    {viewingDocument.contentType?.includes('pdf') ? 'ID Proof Document — PDF' : 'ID Proof — Image'}
                  </h3>
                  <p className="text-gray-400 text-xs mt-0.5">Registration verification document</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Zoom Controls */}
                <div className="flex items-center bg-white/10 rounded-xl border border-white/10 p-1 mr-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleZoom(-0.2); }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white transition-all font-bold"
                    title="Zoom Out"
                  >
                    −
                  </button>
                  <span className="px-3 text-xs font-mono text-blue-400 font-bold min-w-[60px] text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleZoom(0.2); }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white transition-all font-bold"
                    title="Zoom In"
                  >
                    +
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setZoom(1); }}
                    className="ml-1 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-500/20 text-blue-400 transition-all text-xs font-bold"
                    title="Reset Zoom"
                  >
                    ↺
                  </button>
                </div>

                <a
                  href={viewingDocument.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  New Tab
                </a>
                <button
                  onClick={() => setViewingDocument(null)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-2xl transition-all"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 p-4 overflow-auto bg-slate-950/50 flex flex-col justify-center items-center" style={{ minHeight: '60vh' }}>
              {viewingDocument.contentType?.includes('pdf') ? (
                <div className="w-full flex flex-col items-center gap-6">
                  {/* Cloudinary PDF Preview - Convert first page to image for reliable display */}
                  <div className="relative group max-w-full">
                    <img
                      src={viewingDocument.url.replace('.pdf', '.jpg')}
                      alt="ID Proof Preview"
                      className="max-w-full max-h-[65vh] rounded-xl object-contain shadow-2xl border border-white/10 transition-transform duration-200 ease-out"
                      style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/600x800/1e293b/white?text=PDF+Document+Ready+-+Download+below';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl backdrop-blur-sm">
                      <a
                        href={viewingDocument.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-6 py-3 bg-white text-black font-black rounded-xl shadow-xl flex items-center gap-2 transform scale-90 group-hover:scale-100 transition-transform"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Full PDF
                      </a>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <p className="text-gray-400 text-xs text-center max-w-md">
                      Showing a secure image preview of the first page. <br />
                      Click the preview or buttons below to view/download the full document.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative overflow-hidden w-full h-full flex items-center justify-center">
                  <img
                    src={viewingDocument.url}
                    alt="ID Proof"
                    className="max-w-full max-h-[75vh] rounded-2xl object-contain shadow-2xl border border-white/5 transition-transform duration-200 ease-out"
                    style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-5 bg-slate-800/30 border-t border-white/10 flex justify-between items-center">
              <div className="flex gap-3">
                <a
                  href={viewingDocument.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all text-sm flex items-center gap-2 shadow-lg shadow-blue-900/20"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View Full Document
                </a>
                <a
                  href={viewingDocument.url}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all text-sm border border-white/10 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </a>
              </div>
              <button
                onClick={() => setViewingDocument(null)}
                className="px-8 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all text-sm border border-white/5"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agronomists;
