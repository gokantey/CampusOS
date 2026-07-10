import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { saveLocal } from '../db/dbHelpers';
import { Package, Plus, ShieldAlert, CheckCircle, HelpCircle } from 'lucide-react';

export default function Assets() {
  const [activeSubTab, setActiveSubTab] = useState('register'); // 'list', 'register'

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [location, setLocation] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [condition, setCondition] = useState('Good');
  const [dateAcquired, setDateAcquired] = useState('');

  // Database queries
  const assets = useLiveQuery(() => db.assets.where('is_deleted').equals(0).toArray()) || [];

  // Register Asset
  const handleRegisterAsset = async (e) => {
    e.preventDefault();
    if (!name || !category) return;

    try {
      await saveLocal('assets', {
        name,
        category,
        description,
        quantity: parseInt(quantity),
        location,
        serial_number: serialNumber,
        condition,
        date_acquired: dateAcquired || null
      });

      // Reset
      setName('');
      setCategory('');
      setDescription('');
      setQuantity(1);
      setLocation('');
      setSerialNumber('');
      setCondition('Good');
      setDateAcquired('');
      setActiveSubTab('list');
    } catch (err) {
      console.error(err);
      alert('Error registering asset.');
    }
  };

  // Change asset condition status
  const handleConditionChange = async (assetId, newCondition) => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;

    try {
      await saveLocal('assets', {
        ...asset,
        condition: newCondition
      });
    } catch (err) {
      console.error(err);
      alert('Error updating condition status.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" style={{ color: 'var(--text-dark)' }}>
      {/* Sub Tabs Navigation */}
      <div className="tabs-header">
        <button
          onClick={() => setActiveSubTab('register')}
          className={`tab-button ${activeSubTab === 'register' ? 'active' : ''}`}
        >
          Log Asset
        </button>
        <button
          onClick={() => setActiveSubTab('list')}
          className={`tab-button ${activeSubTab === 'list' ? 'active' : ''}`}
        >
          Inventory List
        </button>
      </div>

      {activeSubTab === 'list' && (
        <div className="space-y-4 animate-fade-in">
          {/* Inventory Table */}
          <div className="premium-table-wrapper">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Location</th>
                  <th>Serial / Tag No.</th>
                  <th>Condition</th>
                  <th>Update Condition</th>
                </tr>
              </thead>
              <tbody>
                {assets.map(asset => (
                  <tr key={asset.id}>
                    <td style={{ fontWeight: '700', color: 'var(--text-dark)' }}>
                      <div>{asset.name}</div>
                      {asset.description && <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '2px' }}>{asset.description}</div>}
                    </td>
                    <td>{asset.category}</td>
                    <td>{asset.quantity}</td>
                    <td>{asset.location || <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Unassigned</span>}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{asset.serial_number || '-'}</td>
                    <td>
                      {asset.condition === 'Good' ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          color: 'var(--success)',
                          border: '1px solid rgba(16, 185, 129, 0.2)',
                          fontWeight: '600'
                        }}>
                          <CheckCircle className="w-3 h-3" />
                          Good
                        </span>
                      ) : asset.condition === 'Needs Repair' ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          backgroundColor: 'rgba(245, 158, 11, 0.1)',
                          color: 'var(--warning)',
                          border: '1px solid rgba(245, 158, 11, 0.2)',
                          fontWeight: '600'
                        }}>
                          <HelpCircle className="w-3 h-3" style={{ width: '12px', height: '12px' }} />
                          Needs Repair
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          color: 'var(--danger)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          fontWeight: '600'
                        }}>
                          <ShieldAlert className="w-3 h-3" />
                          Damaged
                        </span>
                      )}
                    </td>
                    <td>
                      <select
                        value={asset.condition}
                        onChange={(e) => handleConditionChange(asset.id, e.target.value)}
                        className="input-field select-field"
                        style={{ padding: '6px 12px', fontSize: '12px', width: '140px' }}
                      >
                        <option value="Good">Good</option>
                        <option value="Needs Repair">Needs Repair</option>
                        <option value="Damaged">Damaged</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {assets.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>No school inventory assets logged.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'register' && (
        <div className="glass-card max-w-2xl animate-fade-in" style={{ margin: '0 auto' }}>
          <h2 className="glass-card-title" style={{ fontSize: '18px', marginBottom: '20px' }}>Log New School Asset</h2>
          <form onSubmit={handleRegisterAsset} className="space-y-4">
            <div className="grid-2" style={{ gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Item Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  placeholder="e.g. Teacher Desks, Computers"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input-field"
                  placeholder="e.g. Furniture, ICT"
                  required
                />
              </div>
            </div>

            <div className="grid-3" style={{ gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Serial / Tag ID</label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="input-field"
                  placeholder="e.g. SN-54321 (Optional)"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Initial Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="input-field select-field"
                >
                  <option value="Good">Good</option>
                  <option value="Needs Repair">Needs Repair</option>
                  <option value="Damaged">Damaged</option>
                </select>
              </div>
            </div>

            <div className="grid-2" style={{ gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Location / Room</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="input-field"
                  placeholder="e.g. Science Lab, Classroom 2B"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Date Acquired</label>
                <input
                  type="date"
                  value={dateAcquired}
                  onChange={(e) => setDateAcquired(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Item Description / Specifications</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field"
                style={{ height: '90px', resize: 'none' }}
                placeholder="Details about the item..."
              ></textarea>
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={() => setActiveSubTab('list')}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
              >
                Save Asset Log
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
