import React, { useState } from 'react';
import { X, Hash, Lock, Globe } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './CreateRoom.css';

const CreateRoom = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: false
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { socket } = useSocket();
  const { user } = useAuth();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Room name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Room name must be at least 2 characters';
    } else if (formData.name.trim().length > 20) {
      newErrors.name = 'Room name must be less than 20 characters';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.name.trim())) {
      newErrors.name = 'Room name can only contain letters, numbers, hyphens, and underscores';
    }
    
    if (formData.description && formData.description.length > 100) {
      newErrors.description = 'Description must be less than 100 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    socket.emit('create_room', {
      name: formData.name.trim(),
      description: formData.description.trim(),
      isPrivate: formData.isPrivate
    });

    // Listen for success or error
    const handleSuccess = (roomData) => {
      toast.success(`Room "${roomData.name}" created successfully!`);
      setLoading(false);
      onClose();
      socket.off('room_created_success', handleSuccess);
      socket.off('error', handleError);
    };

    const handleError = (error) => {
      toast.error(error.message || 'Failed to create room');
      setLoading(false);
      socket.off('room_created_success', handleSuccess);
      socket.off('error', handleError);
    };

    socket.on('room_created_success', handleSuccess);
    socket.on('error', handleError);
  };

  return (
    <div className="create-room-overlay">
      <div className="create-room-modal">
        <div className="modal-header">
          <h2>Create New Room</h2>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="create-room-form">
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              <Hash size={16} />
              Room Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`form-input ${errors.name ? 'error' : ''}`}
              placeholder="Enter room name (e.g., gaming, music)"
              disabled={loading}
              maxLength={20}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description (Optional)
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={`form-textarea ${errors.description ? 'error' : ''}`}
              placeholder="Describe what this room is about..."
              disabled={loading}
              maxLength={100}
              rows={3}
            />
            {errors.description && <span className="error-message">{errors.description}</span>}
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isPrivate"
                checked={formData.isPrivate}
                onChange={handleChange}
                disabled={loading}
              />
              <div className="checkbox-custom">
                {formData.isPrivate ? <Lock size={14} /> : <Globe size={14} />}
              </div>
              <span>
                {formData.isPrivate ? 'Private Room' : 'Public Room'}
              </span>
            </label>
            <p className="checkbox-description">
              {formData.isPrivate 
                ? 'Only invited members can join this room'
                : 'Anyone can discover and join this room'
              }
            </p>
          </div>

          {user?.isGuest && (
            <div className="guest-warning">
              <p>
                💡 As a guest, you can create rooms but won't be able to manage them later. 
                Consider <strong>registering an account</strong> for full room management features.
              </p>
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="create-button"
              disabled={loading || !formData.name.trim()}
            >
              {loading ? 'Creating...' : 'Create Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoom;