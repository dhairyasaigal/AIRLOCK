import React from 'react';
import './LogsList.css';

const LogsList = ({ logs, onSelectLog, selectedLogId }) => {
    if (!logs || logs.length === 0) {
        return (
            <div className="logs-list">
                <div className="empty-state">
                    <p>No logs found. Start using the extension to see activity here.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="logs-list">
            {logs.map((log) => (
                <div
                    key={log._id}
                    className={`log-card ${selectedLogId === log._id ? 'selected' : ''}`}
                    onClick={() => onSelectLog(log)}
                >
                    <div className="log-header">
                        <span className="platform-badge">{log.platform}</span>
                        <span className="timestamp">
                            {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                    </div>
                    <div className="log-preview">
                        {(log.maskedPrompt || log.originalPrompt || 'No prompt').substring(0, 60)}
                        {(log.maskedPrompt || log.originalPrompt || '').length > 60 ? '...' : ''}
                    </div>
                    <div className="log-footer">
                        <span className={`risk-badge ${(log.riskLevel || '').toLowerCase()}`}>
                            {log.riskLevel || 'LOW'} Risk
                        </span>
                        {log.verificationResult?.status && (
                            <span className="status-icon">
                                {log.verificationResult.status.toUpperCase() === 'VERIFIED' && '✅'}
                                {log.verificationResult.status.toUpperCase() === 'WARNING' && '⚠️'}
                                {(log.verificationResult.status.toUpperCase() === 'ERROR' || log.verificationResult.status.toUpperCase() === 'PENDING') && '❌'}
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default LogsList;
