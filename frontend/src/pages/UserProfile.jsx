import { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import LocationUpdate from '../components/LocationUpdate';
import { useLanguage } from '../context/LanguageContext';

const UserProfile = () => {
  const { user, updateUser } = useAuth();
  const { lang, selectLanguage, SUPPORTED_LANGUAGES } = useLanguage();
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    language: '',
    district: '',
    taluka: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['profile', 'location', 'password', 'language'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getProfile();
      setProfile(response.data);
      setFormData({
        fullName: response.data.fullName || '',
        language: response.data.language || 'en',
        district: response.data.address?.district || '',
        taluka: response.data.address?.taluka || '',
      });
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await userAPI.updateProfile(formData);
      const updatedUser = response.data;
      updateUser(updatedUser);
      setProfile(updatedUser);
      setFormData({
        fullName: updatedUser.fullName || '',
        language: updatedUser.language || 'en',
        district: updatedUser.address?.district || '',
        taluka: updatedUser.address?.taluka || '',
      });
      setError('');
      alert('Profile updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    try {
      await userAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setError('');
      alert('Password changed successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset file input
    e.target.value = '';

    try {
      const response = await userAPI.uploadPhoto(file);
      if (response.data?.user) {
        const updatedUser = response.data.user;
        updateUser(updatedUser);
        setProfile(updatedUser);
        setError('');
        alert('Photo uploaded successfully');
      } else {
        // If response doesn't have user, fetch profile again
        await fetchProfile();
        setError('');
        alert('Photo uploaded successfully');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to upload photo';
      setError(errorMessage);
      // Don't log out on upload error - just show the error
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.error('Upload error:', errorMessage);
      }
    }
  };

  const handlePhotoDelete = async () => {
    if (window.confirm('Are you sure you want to delete your profile photo?')) {
      try {
        await userAPI.deletePhoto();
        fetchProfile();
        setError('');
        alert('Photo deleted successfully');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete photo');
      }
    }
  };

  const handlePhotoClick = () => {
    if (profile?.profilePhoto?.url) {
      setShowPhotoModal(true);
    }
  };

  const closePhotoModal = () => {
    setShowPhotoModal(false);
  };

  if (loading) {
    return (
      <div className="profile-container">
        <style>{`
          .profile-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            text-align: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
              'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
              sans-serif;
          }
        `}</style>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <style>{`
        .profile-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
            'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
            sans-serif;
        }

        .profile-header {
          font-size: 2rem;
          font-weight: bold;
          color: #2d5016;
          margin-bottom: 30px;
        }

        .error-message {
          background: #f8d7da;
          color: #721c24;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid #f5c6cb;
          margin-bottom: 20px;
        }

        .profile-card {
          background: white;
          border-radius: 10px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .tab-navigation {
          display: flex;
          border-bottom: 2px solid #e0e0e0;
        }

        .tab-button {
          padding: 15px 30px;
          font-size: 1rem;
          font-weight: 500;
          background: none;
          border: none;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          transition: all 0.3s;
          color: #666;
        }

        .tab-button:hover {
          background: #f5f5f5;
          color: #333;
        }

        .tab-button.active {
          color: #28a745;
          border-bottom-color: #28a745;
        }

        .tab-content {
          padding: 30px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-label {
          display: block;
          font-size: 0.9rem;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
        }

        .form-input,
        .form-select {
          width: 100%;
          padding: 10px 15px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.3s;
          box-sizing: border-box;
        }

        .form-input:focus,
        .form-select:focus {
          outline: none;
          border-color: #28a745;
        }

        .form-input:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }

        .photo-section {
          margin-bottom: 30px;
        }

        .photo-preview {
          margin-bottom: 15px;
        }

        .photo-image {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          object-fit: cover;
          cursor: pointer;
          border: 4px solid #28a745;
          transition: transform 0.3s, box-shadow 0.3s;
        }

        .photo-image:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }

        .photo-actions {
          display: flex;
          gap: 10px;
        }

        .button {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s;
        }

        .button-primary {
          background: #28a745;
          color: white;
        }

        .button-primary:hover {
          background: #218838;
        }

        .button-danger {
          background: #dc3545;
          color: white;
        }

        .button-danger:hover {
          background: #c82333;
        }

        .file-input-wrapper {
          position: relative;
          display: inline-block;
        }

        .file-input-wrapper input[type=file] {
          position: absolute;
          left: -9999px;
        }

        .file-input-label {
          display: inline-block;
          padding: 10px 20px;
          background: #28a745;
          color: white;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.3s;
        }

        .file-input-label:hover {
          background: #218838;
        }

        /* Photo Modal Styles */
        .photo-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .photo-modal-content {
          position: relative;
          max-width: 90%;
          max-height: 90%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .photo-modal-image {
          max-width: 100%;
          max-height: 90vh;
          object-fit: contain;
          border-radius: 10px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        }

        .photo-modal-close {
          position: absolute;
          top: -40px;
          right: 0;
          background: white;
          color: #333;
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          font-size: 1.5rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.3s;
        }

        .photo-modal-close:hover {
          background: #f0f0f0;
        }

        .form-actions {
          margin-top: 30px;
        }

        @media (max-width: 768px) {
          .profile-container {
            padding: 10px;
          }

          .profile-header {
            font-size: 1.5rem;
          }

          .tab-content {
            padding: 20px;
          }

          .photo-actions {
            flex-direction: column;
          }

          .photo-modal-close {
            top: -50px;
            right: -10px;
          }
        }
      `}</style>

      <h1 className="profile-header">Profile</h1>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="profile-card">
        <div className="tab-navigation">
          <button
            onClick={() => setActiveTab('profile')}
            className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('location')}
            className={`tab-button ${activeTab === 'location' ? 'active' : ''}`}
          >
            Location
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`tab-button ${activeTab === 'password' ? 'active' : ''}`}
          >
            Change Password
          </button>
          <button
            onClick={() => setActiveTab('language')}
            className={`tab-button ${activeTab === 'language' ? 'active' : ''}`}
          >
            🌐 Language
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'profile' && (
            <div>
              <div className="photo-section">
                <label className="form-label">Profile Photo</label>
                {profile?.profilePhoto?.url && (
                  <div className="photo-preview">
                    <img
                      src={profile.profilePhoto.url}
                      alt="Profile"
                      className="photo-image"
                      onClick={handlePhotoClick}
                      title="Click to view full size"
                    />
                  </div>
                )}
                <div className="photo-actions">
                  <div className="file-input-wrapper">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      id="photo-upload"
                    />
                    <label htmlFor="photo-upload" className="file-input-label">
                      Upload Photo
                    </label>
                  </div>
                  {profile?.profilePhoto && (
                    <button
                      onClick={handlePhotoDelete}
                      className="button button-danger"
                    >
                      Delete Photo
                    </button>
                  )}
                </div>
              </div>

              <form onSubmit={handleProfileUpdate}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile Number</label>
                  <input
                    type="text"
                    disabled
                    className="form-input"
                    value={profile?.mobileNumber || ''}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Language</label>
                  <select
                    className="form-select"
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="mr">Marathi</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">District</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Taluka</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.taluka}
                    onChange={(e) => setFormData({ ...formData, taluka: e.target.value })}
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="button button-primary">
                    Update Profile
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'location' && (
            <LocationUpdate
              currentLocation={profile?.location}
              onLocationUpdated={(updatedUser) => {
                setProfile(updatedUser);
                updateUser(updatedUser);
              }}
            />
          )}

          {activeTab === 'password' && (
            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    required
                    className="form-input pr-10"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, currentPassword: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                    aria-label={showPasswords.current ? "Hide password" : "Show password"}
                  >
                    {showPasswords.current ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    required
                    className="form-input pr-10"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                    aria-label={showPasswords.new ? "Hide password" : "Show password"}
                  >
                    {showPasswords.new ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    required
                    className="form-input pr-10"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                    aria-label={showPasswords.confirm ? "Hide password" : "Show password"}
                  >
                    {showPasswords.confirm ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="button button-primary">
                  Change Password
                </button>
              </div>
            </form>
          )}

          {activeTab === 'language' && (
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#2d5016', marginBottom: '20px' }}>
                🌐 Language Settings
              </h2>
              <p style={{ color: '#555', marginBottom: '24px', fontSize: '0.95rem' }}>
                Select your preferred language. The entire interface will be translated.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {SUPPORTED_LANGUAGES.map((language) => (
                  <button
                    key={language.code}
                    onClick={() => selectLanguage(language.code)}
                    style={{
                      padding: '20px',
                      borderRadius: '12px',
                      border: `2px solid ${lang === language.code ? '#16a34a' : '#e5e7eb'}`,
                      background: lang === language.code
                        ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)'
                        : '#fff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                      boxShadow: lang === language.code
                        ? '0 4px 12px rgba(22,163,74,0.2)'
                        : '0 1px 4px rgba(0,0,0,0.06)',
                      transform: lang === language.code ? 'translateY(-2px)' : 'none',
                    }}
                  >
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{language.flag}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a1a1a' }}>{language.nativeName}</div>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>{language.name}</div>
                    {lang === language.code && (
                      <div style={{
                        marginTop: '10px',
                        fontSize: '0.8rem',
                        color: '#16a34a',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        ✓ Currently active
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <p style={{ marginTop: '20px', fontSize: '0.82rem', color: '#9ca3af' }}>
                Translations are cached locally for faster performance across sessions.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Photo Modal */}
      {showPhotoModal && profile?.profilePhoto?.url && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closePhotoModal}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-r from-gray-800 to-gray-900 text-white px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile Photo
              </h3>
              <button
                onClick={closePhotoModal}
                className="text-white hover:text-gray-200 text-3xl font-bold hover:bg-white/10 rounded-full w-10 h-10 flex items-center justify-center transition-colors"
                aria-label="Close photo preview"
              >
                ×
              </button>
            </div>
            <div className="p-6 flex justify-center">
              <img
                src={profile.profilePhoto.url}
                alt="Profile Photo"
                className="max-w-full max-h-[70vh] rounded-xl object-contain shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
