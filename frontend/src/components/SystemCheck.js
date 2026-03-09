import React, { useEffect, useState } from 'react'
import client from '../api/citrusClient';

const SystemCheck = () => {
    const [status, setStatus] = useState("Connecting...");

    useEffect(() => {
        client.get('/health')
            .then(res => setStatus(res.data.message))
            .catch(err => setStatus("Backend Offline"));
    }, []);

    return (
        <div style={{ padding: '10px', background: '#f0f0f0', borderRadius: '5px' }}>
            <strong>System Status:</strong> {status}
        </div>
    );
};

export default SystemCheck;