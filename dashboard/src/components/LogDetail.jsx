import React from 'react';
import './LogDetail.css';

const LogDetail = ({ log }) => {
    return (
        <div className="log-detail">
            <div className="detail-header">
                <div className="detail-title">
                    <h3>Log Details</h3>
                    <span className="log-id">ID: {log._id}</span>
                </div>
                <div className="detail-meta">
                    <span className="meta-item">
                        <strong>Platform:</strong> {log.platform}
                    </span>
                    <span className="meta-item">
                        <strong>Time:</strong> {new Date(log.timestamp).toLocaleString()}
                    </span>
                </div>
            </div>

            <div className="detail-section">
                <h4>Original Prompt</h4>
                <div className="code-block original">
                    {log.originalPrompt}
                </div>
            </div>

            <div className="detail-section">
                <h4>Masked Prompt (Sent to AI)</h4>
                <div className="code-block masked">
                    {log.maskedPrompt}
                </div>
            </div>

            <div className="detail-section">
                <h4>AI Response</h4>
                <div className="code-block response">
                    {log.aiResponse || 'No response recorded'}
                </div>
            </div>

            <div className="detail-section verification">
                <h4>Verification Result</h4>
                {log.verificationResult ? (
                    <div className={`verification-card ${log.verificationResult.status || 'pending'}`}>
                        <div className="verification-header">
                            <span className="status-label">
                                Status: <strong>{(log.verificationResult.status || 'PENDING').toUpperCase()}</strong>
                            </span>
                            <span className="confidence">
                                Confidence: {typeof log.verificationResult.confidence === 'string' 
                                    ? log.verificationResult.confidence 
                                    : log.verificationResult.confidence 
                                        ? `${Math.round((log.verificationResult.confidence || 0) * 100)}%`
                                        : '0%'}
                            </span>
                        </div>
                        {log.verificationResult.message && (
                            <div className="verification-message">
                                <p>{log.verificationResult.message}</p>
                            </div>
                        )}
                        {log.verificationResult.similarities && (
                            <div className="similarities">
                                <h5>Similarity Scores:</h5>
                                <ul>
                                    {Object.entries(log.verificationResult.similarities).map(([key, value]) => (
                                        <li key={key}>{key}: {value}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {log.verificationResult.secondModelResponse && 
                         !log.verificationResult.secondModelResponse.includes('unavailable') &&
                         !log.verificationResult.secondModelResponse.includes('Error') && (
                            <div className="second-opinion">
                                <h5>Gemini Response:</h5>
                                <p>{log.verificationResult.secondModelResponse.substring(0, 500)}...</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="verification-card pending">
                        <div className="verification-header">
                            <span className="status-label">
                                Status: <strong>PENDING</strong>
                            </span>
                            <span className="confidence">Confidence: 0%</span>
                        </div>
                        <div className="verification-message">
                            <p>Waiting for AI response to trigger verification...</p>
                            <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                                Verification will start automatically when the AI responds.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LogDetail;
