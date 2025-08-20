"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { useUserRole } from '@/hooks/useUserRole';

export default function TeamsPage() {
  const { role, loading: roleLoading } = useUserRole();
  const router = useRouter();
  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [error, setError] = useState(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDescription, setNewTeamDescription] = useState("");

  useEffect(() => {
    if (!roleLoading) {
      if (!role || role !== "admin") {
        router.push("/dashboard");
      }
    }
  }, [role, roleLoading, router]);

  useEffect(() => {
    const fetchTeams = async () => {
      setLoadingTeams(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('teams')
        .select('*')
        .order('name', { ascending: true });

      if (fetchError) {
        console.error('Error fetching teams:', fetchError.message);
        setError(fetchError.message);
      } else {
        setTeams(data);
      }
      setLoadingTeams(false);
    };

    if (!roleLoading && role === "admin") {
      fetchTeams();
    }
  }, [role, roleLoading]);

  const handleAddTeam = async (e) => {
    e.preventDefault();
    setError(null);

    if (!newTeamName || !newTeamDescription) {
      setError("Please fill in all fields for the new team.");
      return;
    }

    const { data, error: insertError } = await supabase
      .from('teams')
      .insert([{ name: newTeamName, description: newTeamDescription }]);

    if (insertError) {
      console.error('Error adding team:', insertError.message);
      setError(insertError.message);
    } else {
      setNewTeamName("");
      setNewTeamDescription("");
      // Re-fetch teams to show the updated list
      const { data: updatedTeams, error: fetchError } = await supabase
        .from('teams')
        .select('*')
        .order('name', { ascending: true });

      if (fetchError) {
        console.error('Error refetching teams:', fetchError.message);
        setError(fetchError.message);
      } else {
        setTeams(updatedTeams);
      }
    }
  };

  const handleDeleteTeam = async (teamId) => {
    setError(null);
    const { error: deleteError } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId);

    if (deleteError) {
      console.error('Error deleting team:', deleteError.message);
      setError(deleteError.message);
    } else {
      setTeams(teams.filter(team => team.id !== teamId));
    }
  };

  if (roleLoading || loadingTeams) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Loading Teams...</div>;
  }

  if (!role || role !== "admin") {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Access Denied</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white">Team Management</h1>

        {error && <p className="text-red-500 text-sm mb-4 text-center">Error: {error}</p>}

        <div className="mb-8 p-6 border rounded-lg shadow-sm bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Add New Team</h2>
          <form onSubmit={handleAddTeam} className="space-y-4">
            <div>
              <label htmlFor="newTeamName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Team Name</label>
              <input
                type="text"
                id="newTeamName"
                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="newTeamDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
              <textarea
                id="newTeamDescription"
                rows="3"
                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={newTeamDescription}
                onChange={(e) => setNewTeamDescription(e.target.value)}
                required
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Team
            </button>
          </form>
        </div>

        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Existing Teams</h2>
        {teams.length === 0 ? (
          <p className="text-center text-lg text-gray-700 dark:text-gray-300">No teams found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Team Name</th>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Description</th>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => (
                  <tr key={team.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">{team.name}</td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">{team.description}</td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600">
                      <button
                        onClick={() => handleDeleteTeam(team.id)}
                        className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
