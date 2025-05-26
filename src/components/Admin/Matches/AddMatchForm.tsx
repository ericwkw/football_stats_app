// src/components/Admin/Matches/AddMatchForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Team } from '@/types/database'; // Import Team type

import { Match } from '@/types/database'; // Import Match type

interface AddMatchFormProps {
  onMatchAdded?: () => void; // Callback for when a match is added or updated
  existingMatchData?: Match | null; // Optional data for editing an existing match
}

// Constants for Match Types
const MATCH_TYPE_INTERNAL = 'internal_friendly';
const MATCH_TYPE_EXTERNAL = 'external_game';

// Constants for Internal Teams
const INTERNAL_TEAMS = [
  { id: 'internal_light_blue', name: 'Light Blue' },
  { id: 'internal_red', name: 'Red' },
  { id: 'internal_black', name: 'Black' },
];

const FCB_UNITED_TEAM_NAME = 'FCB United';
// We might need a way to get FCB United's actual ID from the DB or pre-define it if static
let FCB_UNITED_TEAM_ID: string | null = null; // Will be fetched or created

const MANUAL_ENTRY_PLACEHOLDER = 'manual_entry_placeholder';

export default function AddMatchForm({ onMatchAdded, existingMatchData }: AddMatchFormProps) {
  const isEditMode = !!existingMatchData;
  const [allTeams, setAllTeams] = useState<Team[]>([]); // All teams from DB
  const [externalTeams, setExternalTeams] = useState<Team[]>([]); // Filtered external teams
  const [matchType, setMatchType] = useState<string>(''); // New state for match type
  const [homeTeamId, setHomeTeamId] = useState<string>('');
  const [awayTeamId, setAwayTeamId] = useState<string>('');
  const [matchDate, setMatchDate] = useState<string>('');
  const [homeScore, setHomeScore] = useState<number | null>(null);
  const [awayScore, setAwayScore] = useState<number | null>(null);
  const [venue, setVenue] = useState<string>(''); // Selected venue from dropdown or manual entry
  const [venueManualName, setVenueManualName] = useState<string>(''); // For manual venue entry
  const [distinctVenues, setDistinctVenues] = useState<string[]>([]); // Venues from DB
  const [awayTeamManualName, setAwayTeamManualName] = useState<string>(''); // For external game manual entry
  const VENUE_MANUAL_ENTRY_PLACEHOLDER = 'venue_manual_entry_placeholder';
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(true); // For loading dropdown data
  const [isSubmitting, setIsSubmitting] = useState(false); // For submission state
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Effect to populate form when in edit mode and existingMatchData is available
  useEffect(() => {
    if (isEditMode && existingMatchData && allTeams.length > 0) { // Ensure dependent data is loaded
      setMatchType(existingMatchData.match_type || '');
      
      // Handle team selection differently based on match type
      if (existingMatchData.match_type === MATCH_TYPE_INTERNAL) {
        // For internal matches, find the corresponding internal team IDs
        const homeTeamDetails = allTeams.find(t => t.id === existingMatchData.home_team_id);
        const awayTeamDetails = allTeams.find(t => t.id === existingMatchData.away_team_id);
        
        if (homeTeamDetails) {
          // Find the internal team ID (like 'internal_light_blue') based on team name
          const internalHomeTeam = INTERNAL_TEAMS.find(t => t.name === homeTeamDetails.name);
          if (internalHomeTeam) {
            setHomeTeamId(internalHomeTeam.id);
          }
        }
        
        if (awayTeamDetails) {
          // Find the internal team ID (like 'internal_red') based on team name
          const internalAwayTeam = INTERNAL_TEAMS.find(t => t.name === awayTeamDetails.name);
          if (internalAwayTeam) {
            setAwayTeamId(internalAwayTeam.id);
          }
        }
      } else if (existingMatchData.match_type === MATCH_TYPE_EXTERNAL) {
        // For external matches, FCB United is always home team
        if (FCB_UNITED_TEAM_ID) {
          setHomeTeamId(FCB_UNITED_TEAM_ID);
        }
        
        // For away team, use the ID directly or handle manual entry
        if (existingMatchData.away_team_id) {
          const awayTeamDetails = allTeams.find(t => t.id === existingMatchData.away_team_id);
          if (awayTeamDetails) {
            const isKnownExternalTeam = externalTeams.some(t => t.id === awayTeamDetails.id);
            if (isKnownExternalTeam) {
              setAwayTeamId(awayTeamDetails.id);
            } else {
              setAwayTeamId(MANUAL_ENTRY_PLACEHOLDER);
              setAwayTeamManualName(awayTeamDetails.name);
            }
          }
        }
      } else {
        // Default case, just set the IDs directly
        setHomeTeamId(existingMatchData.home_team_id || '');
        setAwayTeamId(existingMatchData.away_team_id || '');
      }
      
      // Format date for datetime-local input
      if (existingMatchData.match_date) {
        const dateObj = new Date(existingMatchData.match_date);
        // Format as YYYY-MM-DDThh:mm (required by datetime-local input)
        setMatchDate(dateObj.toISOString().substring(0, 16));
      } else {
        setMatchDate('');
      }
      
      // Handle potentially undefined scores
      setHomeScore(existingMatchData.home_score ?? null);
      setAwayScore(existingMatchData.away_score ?? null);
      
      // Venue handling
      if (existingMatchData.venue && distinctVenues.includes(existingMatchData.venue)) {
        setVenue(existingMatchData.venue);
        setVenueManualName('');
      } else if (existingMatchData.venue) {
        setVenue(VENUE_MANUAL_ENTRY_PLACEHOLDER);
        setVenueManualName(existingMatchData.venue);
      } else {
        setVenue('');
        setVenueManualName('');
      }
    }
  }, [isEditMode, existingMatchData, allTeams, externalTeams, distinctVenues, FCB_UNITED_TEAM_NAME, 
      MATCH_TYPE_INTERNAL, MATCH_TYPE_EXTERNAL, FCB_UNITED_TEAM_ID, MANUAL_ENTRY_PLACEHOLDER, VENUE_MANUAL_ENTRY_PLACEHOLDER]);

  useEffect(() => {
    const fetchInitialData = async () => {
      setFormLoading(true);
      setError(null);
      setDistinctVenues([]); // Reset venues on each fetch

      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select<Team[]>('*');

      if (teamsError) {
        console.error('Error fetching teams:', teamsError);
        setError(teamsError.message);
        setAllTeams([]);
        setExternalTeams([]);
      } else if (teamsData) {
        setAllTeams(teamsData);
        // Attempt to find or create FCB United and get its ID
        let fcbId = teamsData.find(t => t.name === FCB_UNITED_TEAM_NAME)?.id;
        if (!fcbId) {
          try {
            const { data: newFcbTeam, error: fcbError } = await supabase
              .from('teams')
              .insert({ name: FCB_UNITED_TEAM_NAME, team_type: 'club' }) // Assuming a 'team_type' column
              .select('id')
              .single();
            if (fcbError) throw fcbError;
            if (newFcbTeam) {
                fcbId = newFcbTeam.id;
                // Add to allTeams state if newly created
                setAllTeams(prev => [...prev, { id: newFcbTeam.id, name: FCB_UNITED_TEAM_NAME, team_type: 'club', created_at: new Date().toISOString() }]);
            }
          } catch (e: any) {
            console.error('Error ensuring FCB United team:', e);
            setError(`Failed to set up FCB United: ${e.message}`);
            // Proceeding without FCB_UNITED_TEAM_ID might cause issues for external games
          }
        }
        FCB_UNITED_TEAM_ID = fcbId || null;

        // Filter for external teams (excluding FCB United and internal team names)
        const internalTeamNames = INTERNAL_TEAMS.map(t => t.name);
        setExternalTeams(
          teamsData.filter(team => 
            team.name !== FCB_UNITED_TEAM_NAME && 
            !internalTeamNames.includes(team.name) &&
            team.team_type === 'external' // Assuming a 'team_type' column
          )
        );
      } else {
        setAllTeams([]);
        setExternalTeams([]);
      }

      // Fetch distinct venues
      const { data: venuesData, error: venuesError } = await supabase
        .from('matches')
        .select('venue')
        .not('venue', 'is', null) // Ensure venue is not null
        .neq('venue', '');         // Ensure venue is not an empty string

      if (venuesError) {
        console.error('Error fetching venues:', venuesError);
        // setError(prev => prev ? `${prev}, ${venuesError.message}` : venuesError.message); // Optionally add to main error
      } else if (venuesData) {
        const allFetchedVenues = venuesData.map(v => v.venue).filter(v => typeof v === 'string' && v.trim() !== '');
        setDistinctVenues([...new Set(allFetchedVenues)]); // Create a unique set and convert back to array
      }

      setFormLoading(false);
    };

    fetchInitialData();
  }, []);

  // Helper function to get or create team ID (primarily for external teams now)
  const getOrCreateTeamId = async (teamName: string, teamType: 'external' | 'internal' | 'club' = 'external'): Promise<string> => {
    const trimmedName = teamName.trim();
    if (!trimmedName) {
      throw new Error('Team name cannot be empty.');
    }

    const existingTeam = allTeams.find(t => t.name === trimmedName && t.team_type === teamType);
    if (existingTeam) {
      return existingTeam.id;
    }

    // Create new team if it doesn't exist
    const { data: newTeamData, error: insertError } = await supabase
      .from('teams')
      .insert([{ 
        name: trimmedName, 
        primary_shirt_color: trimmedName, // Set primary shirt color to the team name for internal teams
        team_type: teamType 
      }])
      .select('id, name, team_type, created_at')
      .single();

    if (insertError) {
      console.error('Error creating new team:', insertError);
      throw new Error(`Failed to create team "${trimmedName}": ${insertError.message}`);
    }
    if (!newTeamData) {
      throw new Error(`Failed to create team "${trimmedName}" and retrieve its ID.`);
    }

    // Refresh teams list in state
    setAllTeams(prev => [...prev, newTeamData as Team]);
    if (teamType === 'external') {
      setExternalTeams(prev => [...prev, newTeamData as Team]);
    }
    if (trimmedName === FCB_UNITED_TEAM_NAME && teamType === 'club') {
      FCB_UNITED_TEAM_ID = newTeamData.id;
    }

    return newTeamData.id;
  };

  const handleMatchTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMatchType = e.target.value;
    setMatchType(newMatchType);
    // Reset team selections and manual entries when match type changes
    setHomeTeamId('');
    setAwayTeamId('');
    setAwayTeamManualName('');
    setVenue(''); 
    setVenueManualName(''); // Reset manual venue entry on match type change
    setError(null);
    setMessage(null);

    if (newMatchType === MATCH_TYPE_EXTERNAL) {
      if (FCB_UNITED_TEAM_ID) {
        setHomeTeamId(FCB_UNITED_TEAM_ID); // Auto-set Home Team to FCB United
      } else {
        setError('FCB United team ID not available. Please check configuration or database.');
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    // Final validated venue value
    const finalVenue = venue === VENUE_MANUAL_ENTRY_PLACEHOLDER ? venueManualName.trim() : venue;
    if (!finalVenue) {
      setError('Please select or enter a venue.');
      setIsSubmitting(false);
      return;
    }

    // Validate and process team IDs based on match type
    let finalHomeTeamId = homeTeamId;
    let finalAwayTeamId = awayTeamId;

    // Handle manual entry for away team in external games
    if (matchType === MATCH_TYPE_EXTERNAL && awayTeamId === MANUAL_ENTRY_PLACEHOLDER) {
      if (!awayTeamManualName.trim()) {
        setError('Please enter the Away Team name for the external game.');
        setIsSubmitting(false);
        return;
      }
      try {
        finalAwayTeamId = await getOrCreateTeamId(awayTeamManualName.trim(), 'external');
      } catch (e) {
        setError((e as Error).message);
        setIsSubmitting(false);
        return;
      }
    }

    // For internal friendlies, we need to get actual UUIDs from the database for the internal teams
    if (matchType === MATCH_TYPE_INTERNAL) {
      if (!homeTeamId || !INTERNAL_TEAMS.find(t => t.id === homeTeamId)) {
        setError('Please select a Home Team for the internal friendly.');
        setIsSubmitting(false);
        return;
      }
      if (!awayTeamId || !INTERNAL_TEAMS.find(t => t.id === awayTeamId)) {
        setError('Please select an Away Team for the internal friendly.');
        setIsSubmitting(false);
        return;
      }
      if (homeTeamId === awayTeamId) {
        setError('Home and Away teams cannot be the same for an internal friendly.');
        setIsSubmitting(false);
        return;
      }
      
      // Get the team names from INTERNAL_TEAMS
      const homeTeamName = INTERNAL_TEAMS.find(t => t.id === homeTeamId)?.name;
      const awayTeamName = INTERNAL_TEAMS.find(t => t.id === awayTeamId)?.name;
      
      if (!homeTeamName || !awayTeamName) {
        setError('Could not determine team names. Please try again.');
        setIsSubmitting(false);
        return;
      }
      
      try {
        // Look up or create actual team UUIDs in the database
        finalHomeTeamId = await getOrCreateTeamId(homeTeamName, 'internal');
        finalAwayTeamId = await getOrCreateTeamId(awayTeamName, 'internal');
      } catch (e) {
        setError((e as Error).message);
        setIsSubmitting(false);
        return;
      }
    }

    // Final validation for team IDs before submission
    if (!finalHomeTeamId) {
      setError('Home team is required and could not be determined.');
      setIsSubmitting(false);
      return;
    }
    if (!finalAwayTeamId) {
      setError('Away team is required and could not be determined.');
      setIsSubmitting(false);
      return;
    }
    // Check for same team playing against itself, this should be after final IDs are determined
    if (finalHomeTeamId === finalAwayTeamId) {
        setError('Home team and Away team cannot be the same.');
        setIsSubmitting(false);
        return;
    }

    try {
      const matchPayload: Record<string, any> = { // Renamed and properly typed
        home_team_id: finalHomeTeamId, 
        away_team_id: finalAwayTeamId, 
        match_date: matchDate,
        home_score: homeScore,
        away_score: awayScore,
        venue: finalVenue,
        match_type: matchType,
      };

      let supaError = null;

      if (isEditMode && existingMatchData?.id) {
        // Update existing match
        const { error: updateError } = await supabase
          .from('matches')
          .update(matchPayload) // Uses matchPayload
          .eq('id', existingMatchData.id)
          .select();
        supaError = updateError;
      } else {
        // Insert new match
        const { error: insertError } = await supabase
          .from('matches')
          .insert([matchPayload]) // Uses matchPayload
          .select();
        supaError = insertError;
      }

      if (supaError) {
        throw supaError;
      }

      setMessage(isEditMode ? 'Match updated successfully!' : 'Match added successfully!'); // New message
      if (!isEditMode) { // Conditional reset
        setMatchType('');
        setHomeTeamId('');
        setAwayTeamId('');
        setMatchDate('');
        setHomeScore(null);
        setAwayScore(null);
        setVenue('');
        setVenueManualName('');
        setAwayTeamManualName('');
      }
      
      onMatchAdded?.(); // Call the callback

    } catch (e) {
      console.error(isEditMode ? 'Error updating match:' : 'Error adding match:', e); // New error message
      setError(isEditMode ? `Failed to update match: ${(e as Error).message}` : `Failed to add match: ${(e as Error).message}`); // New error message
    } finally {
      setIsSubmitting(false);
      // setLoading(false); // setLoading is for initial data, not submission status
    }
  };

  if (formLoading) {
    return <p className="text-gray-700">Loading form data...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Match Type Selector */}
      <div>
        <label htmlFor="matchType" className="block text-sm font-medium text-gray-700">
          Match Type
        </label>
        <div className="flex flex-wrap gap-2 mt-1">
          <button
            type="button"
            onClick={() => {
              setMatchType(MATCH_TYPE_EXTERNAL);
              // Auto-set Home Team to FCB United for external games
              if (FCB_UNITED_TEAM_ID) {
                setHomeTeamId(FCB_UNITED_TEAM_ID);
              }
              // Reset other fields
              setAwayTeamId('');
              setAwayTeamManualName('');
              setVenue('');
              setVenueManualName('');
              setError(null);
              setMessage(null);
            }}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              matchType === MATCH_TYPE_EXTERNAL
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            External Game
          </button>
          <button
            type="button"
            onClick={() => {
              setMatchType(MATCH_TYPE_INTERNAL);
              // Reset fields
              setHomeTeamId('');
              setAwayTeamId('');
              setVenue('');
              setVenueManualName('');
              setError(null);
              setMessage(null);
            }}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              matchType === MATCH_TYPE_INTERNAL
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Internal Friendly
          </button>
        </div>
      </div>

      {/* Venue Input - Always visible if matchType is selected, now with dropdown and manual entry */}
      {matchType && (
        <div>
          <label htmlFor="venue" className="block text-sm font-medium text-gray-700">
            Venue
          </label>
          <select
            id="venue"
            value={venue}
            onChange={(e) => {
              setVenue(e.target.value);
              if (e.target.value !== VENUE_MANUAL_ENTRY_PLACEHOLDER) {
                setVenueManualName('');
              }
            }}
            required
            className="block w-full px-3 py-2 mt-1 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="" disabled>Select venue or enter manually</option>
            {distinctVenues.map((v, index) => (
              <option key={index} value={v}>
                {v}
              </option>
            ))}
            <option value={VENUE_MANUAL_ENTRY_PLACEHOLDER}>Enter Manually...</option>
          </select>
          {venue === VENUE_MANUAL_ENTRY_PLACEHOLDER && (
            <div className="mt-2">
              <label htmlFor="venueManualName" className="block text-xs font-medium text-gray-600">
                Enter Venue Name:
              </label>
              <input
                id="venueManualName"
                type="text"
                value={venueManualName}
                onChange={(e) => setVenueManualName(e.target.value)}
                required
                className="block w-full px-3 py-2 mt-1 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Manually enter venue name"
              />
            </div>
          )}
        </div>
      )}

      {/* Match Date - Always visible */}
      <div>
        <label htmlFor="matchDate" className="block text-sm font-medium text-gray-700">
          Match Date
        </label>
        <input
          id="matchDate"
          type="datetime-local"
          value={matchDate}
          onChange={(e) => setMatchDate(e.target.value)}
          required
          className="block w-full px-3 py-2 mt-1 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      {/* Conditional Team Selectors */}
      {matchType === MATCH_TYPE_INTERNAL && (
        <>
          <div>
            <label htmlFor="homeTeamInternal" className="block text-sm font-medium text-gray-700">
              Home Team (Internal)
            </label>
            <div className="flex flex-wrap gap-2 mt-1">
              {INTERNAL_TEAMS.map((team) => (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => setHomeTeamId(team.id)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    homeTeamId === team.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {team.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="awayTeamInternal" className="block text-sm font-medium text-gray-700">
              Away Team (Internal)
            </label>
            <div className="flex flex-wrap gap-2 mt-1">
              {INTERNAL_TEAMS.map((team) => (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => setAwayTeamId(team.id)}
                  disabled={homeTeamId === team.id} // Disable selecting same team for home and away
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    awayTeamId === team.id
                      ? 'bg-blue-600 text-white'
                      : homeTeamId === team.id 
                        ? 'bg-gray-300 text-gray-400 cursor-not-allowed' // Disabled style
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {team.name}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {matchType === MATCH_TYPE_EXTERNAL && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700">Home Team</label>
            <p className="mt-1 text-gray-900">{FCB_UNITED_TEAM_NAME}</p>
            {/* Hidden input or just rely on FCB_UNITED_TEAM_ID in state */}
          </div>
          <div>
            <label htmlFor="awayTeamExternal" className="block text-sm font-medium text-gray-700">
              Away Team (External)
            </label>
            <select
              id="awayTeamExternal"
              value={awayTeamId}
              onChange={(e) => {
                setAwayTeamId(e.target.value);
                if (e.target.value !== MANUAL_ENTRY_PLACEHOLDER) {
                  setAwayTeamManualName('');
                }
              }}
              required={!awayTeamManualName.trim()} // Required if manual name is not being filled
              className="block w-full px-3 py-2 mt-1 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="" disabled>Select opponent or enter manually</option>
              {externalTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
              <option value={MANUAL_ENTRY_PLACEHOLDER}>Enter Manually...</option>
            </select>
            {awayTeamId === MANUAL_ENTRY_PLACEHOLDER && (
              <div className="mt-2">
                <label htmlFor="awayTeamManualName" className="block text-xs font-medium text-gray-600">
                  Enter Away Team Name:
                </label>
                <input
                  id="awayTeamManualName"
                  type="text"
                  value={awayTeamManualName}
                  onChange={(e) => setAwayTeamManualName(e.target.value)}
                  required
                  className="block w-full px-3 py-2 mt-1 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Manually enter away team name"
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* Scores - Visible if a match type is selected */}
      {matchType && (
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <div>
            <label htmlFor="homeScore" className="block text-sm font-medium text-gray-700">
              Home Score
            </label>
            <input
              id="homeScore"
              type="number"
              value={homeScore === null ? '' : homeScore}
              onChange={(e) => setHomeScore(e.target.value === '' ? null : parseInt(e.target.value, 10))}
              min="0"
              className="block w-full px-3 py-2 mt-1 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter home score"
            />
          </div>
          <div>
            <label htmlFor="awayScore" className="block text-sm font-medium text-gray-700">
              Away Score
            </label>
            <input
              id="awayScore"
              type="number"
              value={awayScore === null ? '' : awayScore}
              onChange={(e) => setAwayScore(e.target.value === '' ? null : parseInt(e.target.value, 10))}
              min="0"
              className="block w-full px-3 py-2 mt-1 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter away score"
            />
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">Error: {error}</p>}
      {message && <p className="mt-2 text-sm text-green-600">{message}</p>}

      {matchType && (
        <div className="pt-5">
<button 
        type="submit" 
        disabled={isSubmitting || formLoading} // Use isSubmitting here
        className="w-full px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline disabled:opacity-50"
      >
        {isEditMode ? 'Update Match' : 'Add Match'}
      </button>
        </div>
      )}
    </form>
  );
}