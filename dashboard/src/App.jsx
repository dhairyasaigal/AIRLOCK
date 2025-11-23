import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import './App.css';
import LogsList from './components/LogsList.jsx';
import LogDetail from './components/LogDetail.jsx';

function App() {
    const [logs, setLogs] = useState([]);
    const [selectedLog, setSelectedLog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [connectionStatus, setConnectionStatus] = useState('checking'); // 'connected', 'disconnected', 'checking'
    const [errorMessage, setErrorMessage] = useState(null);
    const [stats, setStats] = useState({
        totalPrompts: 0,
        maskedPrompts: 0,
        verifiedResponses: 0
    });
    const [riskDistribution, setRiskDistribution] = useState([
        { name: 'CRITICAL', value: 0, color: '#ef4444' },
        { name: 'HIGH', value: 0, color: '#f59e0b' },
        { name: 'MEDIUM', value: 0, color: '#10b981' },
        { name: 'LOW', value: 0, color: '#3b82f6' }
    ]);

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchLogs = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/logs', {
                timeout: 5000
            });
            setLogs(response.data || []);
            calculateStats(response.data || []);
            calculateRiskDistribution(response.data || []);
            setConnectionStatus('connected');
            setErrorMessage(null);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching logs:', error);
            setConnectionStatus('disconnected');
            
            if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
                setErrorMessage('Cannot connect to backend server. Make sure the backend is running on port 5000.');
            } else if (error.response) {
                setErrorMessage(`Backend error: ${error.response.status} - ${error.response.statusText}`);
            } else {
                setErrorMessage(`Connection error: ${error.message}`);
            }
            
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
        const total = data.length;
        const masked = data.filter(log => ['HIGH', 'CRITICAL'].includes((log.riskLevel || '').toUpperCase())).length;
        const verified = data.filter(log => (log.verificationResult?.status || '').toLowerCase() === 'verified').length;
        setStats({ totalPrompts: total, maskedPrompts: masked, verifiedResponses: verified });
    };

    const calculateRiskDistribution = (data) => {
        const dist = [
            { name: 'CRITICAL', value: 0, color: '#ef4444' },
            { name: 'HIGH', value: 0, color: '#f59e0b' },
            { name: 'MEDIUM', value: 0, color: '#10b981' },
            { name: 'LOW', value: 0, color: '#3b82f6' }
        ];

        data.forEach(log => {
            const level = (log.riskLevel || 'LOW').toUpperCase();
            const item = dist.find(d => d.name === level);
            if (item) item.value++;
        });

        setRiskDistribution(dist);
    };

    return (
        <div className="app-container">
            <header className="app-header">
                <div className="logo">
                    <span className="logo-icon">🛡️</span>
                    <h1>AI Safety Firewall <span className="enterprise-badge">ENTERPRISE</span></h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div className="stats-bar">
                        <div className="stat-item">
                            <span className="stat-label">Total Prompts</span>
                            <span className="stat-value">{stats.totalPrompts}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">High Risk</span>
                            <span className="stat-value warning">{stats.maskedPrompts}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Verified</span>
                            <span className="stat-value success">{stats.verifiedResponses}</span>
                        </div>
                    </div>
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        backgroundColor: connectionStatus === 'connected' ? '#10b98120' : connectionStatus === 'disconnected' ? '#ef444420' : '#f59e0b20',
                        border: `1px solid ${connectionStatus === 'connected' ? '#10b981' : connectionStatus === 'disconnected' ? '#ef4444' : '#f59e0b'}`
                    }}>
                        <span style={{ 
                            width: '8px', 
                            height: '8px', 
                            borderRadius: '50%', 
                            backgroundColor: connectionStatus === 'connected' ? '#10b981' : connectionStatus === 'disconnected' ? '#ef4444' : '#f59e0b',
                            animation: connectionStatus === 'checking' ? 'pulse 2s infinite' : 'none'
                        }}></span>
                        <span style={{ fontSize: '12px', fontWeight: '500' }}>
                            {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'disconnected' ? 'Disconnected' : 'Connecting...'}
                        </span>
                    </div>
                </div>
            </header>
            {errorMessage && (
                <div style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    padding: '12px 20px',
                    margin: '0 20px 20px 20px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '14px'
                }}>
                    <span>⚠️</span>
                    <span>{errorMessage}</span>
                    <button 
                        onClick={fetchLogs}
                        style={{
                            marginLeft: 'auto',
                            padding: '6px 12px',
                            backgroundColor: 'white',
                            color: '#ef4444',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '12px'
                        }}
                    >
                        Retry
                    </button>
                </div>
            )}

            <main className="main-content">
                <div className="logs-panel">
                    <div className="chart-container">
                        <h3>Risk Distribution</h3>
                        <div style={{ width: '100%', height: 200 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={riskDistribution}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={60}
                                        innerRadius={30}
                                    >
                                        {riskDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <h2>Activity Log</h2>
                    {loading ? (
                        <div className="loading-state">Loading logs...</div>
                    ) : (
                        <LogsList
                            logs={logs}
                            onSelectLog={setSelectedLog}
                            selectedLogId={selectedLog?._id}
                        />
                    )}
                </div>
                <div className="detail-panel">
                    {selectedLog ? (
                        <LogDetail log={selectedLog} />
                    ) : (
                        <div className="empty-state">
                            <p>Select a log entry to view details</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default App;
