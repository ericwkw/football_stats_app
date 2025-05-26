const { data: leaderboardsData, error: leaderboardsError } = await supabase
  .rpc('get_simplified_leaderboards_with_mp'); 