import React, { useState, useEffect } from 'react';
import { wbsService } from '../../../services/wbsService';
import PhaseItem from './PhaseItem';

const ProjectWBS = ({ projectId, canEdit }) => {
    const [phases, setPhases] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddPhase, setShowAddPhase] = useState(false);
    const [newPhaseName, setNewPhaseName] = useState('');

    useEffect(() => {
        loadWBS();
    }, [projectId]);

    const loadWBS = async () => {
        try {
            setLoading(true);
            const [phasesData, tasksData] = await Promise.all([
                wbsService.getPhases(projectId),
                wbsService.getTasks(projectId)
            ]);
            setPhases(phasesData);
            setTasks(tasksData);
            setError(null);
        } catch (err) {
            console.error('Error loading WBS:', err);
            setError('Failed to load WBS data');
        } finally {
            setLoading(false);
        }
    };

    const handleAddPhase = async (e) => {
        e.preventDefault();
        try {
            await wbsService.createPhase(projectId, {
                name: newPhaseName,
                order: phases.length + 1
            });
            setNewPhaseName('');
            setShowAddPhase(false);
            loadWBS();
        } catch (err) {
            console.error('Error creating phase:', err);
            setError('Failed to create phase');
        }
    };

    const handlePhaseUpdate = () => {
        loadWBS();
    };

    if (loading) return <div className="p-4">Loading WBS...</div>;

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Work Breakdown Structure</h2>
                {canEdit && (
                    <button
                        onClick={() => setShowAddPhase(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        Add Phase
                    </button>
                )}
            </div>

            {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

            {showAddPhase && (
                <div className="mb-6 bg-gray-50 p-4 rounded border border-gray-200">
                    <form onSubmit={handleAddPhase} className="flex gap-4 items-end">
                        <div className="flex-grow">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phase Name</label>
                            <input
                                type="text"
                                value={newPhaseName}
                                onChange={(e) => setNewPhaseName(e.target.value)}
                                className="w-full p-2 border rounded"
                                placeholder="e.g., Discovery, Implementation"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        >
                            Save
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowAddPhase(false)}
                            className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                        >
                            Cancel
                        </button>
                    </form>
                </div>
            )}

            <div className="space-y-6">
                {phases.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                        No phases defined. Start by adding a phase.
                    </div>
                ) : (
                    phases.map(phase => (
                        <PhaseItem
                            key={phase.PhaseID}
                            phase={phase}
                            tasks={tasks.filter(t => t.PhaseID === phase.PhaseID)}
                            projectId={projectId}
                            canEdit={canEdit}
                            onUpdate={handlePhaseUpdate}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default ProjectWBS;
