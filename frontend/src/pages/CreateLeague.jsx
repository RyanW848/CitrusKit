import React, { useState } from 'react';
import client from '../api/citrusClient';

const CreateLeague = () => {
    const [formData, setFormData ] = useState({
        name: '',
        teamCount: 12,
        budget: 260,
        scoringTypes: '5x5'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const payload = { ...formData, scoringTypes: [formData.scoringTypes] };
            const res = await client.post('/leagues', payload);
            alert(`League ${res.data.name} Created!`);
        } catch (err) {
            console.error(err.response?.data?.error || "Creation failed");
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>Setup Your Draft Kit</h2>

            <input 
                placeholder="League Name" 
                onChange={e => setFormData({...formData, name: e.target.value})} 
            />

            <input 
                type="number" 
                value={formData.budget}
                onChange={e => setFormData({...formData, budget: e.target.value})} 
            />

            <button type="submit">Initialize MVP Draft</button>
        </form>
    );
};

export default CreateLeague;