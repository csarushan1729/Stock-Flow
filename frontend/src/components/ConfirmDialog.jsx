import Modal from './Modal'

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Delete', loading = false }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title=" ">
      <div style={{ textAlign: 'center', paddingBottom: '8px' }}>
        <div className="confirm-icon">🗑️</div>
        <div className="confirm-title">{title || 'Confirm Delete'}</div>
        <p className="confirm-message" style={{ marginTop: 8, color: 'var(--text-secondary)', fontSize: 13 }}>
          {message || 'This action cannot be undone.'}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 24 }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
