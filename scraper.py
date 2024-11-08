import pandas as pd
from basketball_reference_web_scraper import client
from datetime import datetime
import time
# Hugmyndir:
# flipi fyrir honours og advanced stats byrjum með total averages
# Loop over each year since start of nba
# Sækja player season totals fyrir allar seasons frá 1950 °
# TODO: Add advanced stats, t.d. PER
# TODO: Save to database
# TODO: Improve filtering logic if needed
# TODO: Get honors
# TODO: Get headshot of player
# TODO: NOta https://github.com/swar/nba_api í staðinn fyrir basketball-reference api...
current_year = datetime.now().year

years_array = list(range(1950, (current_year+1)))  # 2025 is used as the end to include 2024

all_data = pd.DataFrame()
all_data_advanced = pd.DataFrame()

for year in years_array:
    print("getting data for year",year)
    time.sleep(6)
    data = client.players_advanced_season_totals(season_end_year=year)
    df = pd.DataFrame(data)
    all_data_advanced = pd.concat([all_data_advanced, df], ignore_index=True)

#for year in years_array:
#    print("getting data for year",year)
#    time.sleep(6)
#    data = client.players_season_totals(season_end_year=year)
#    df = pd.DataFrame(data)
#    all_data = pd.concat([all_data, df], ignore_index=True)

final_df = pd.read_csv('./temp_nba_df.csv')
advanced_df = pd.read_csv('./advanced_stats_nba.csv')


# Remove duplicate values when player switches teams in same season
duplicates = final_df.duplicated(subset=['age', 'name'], keep=False)

# Keep rows where team is NaN for duplicates to remove instances where player switches teams
df_filtered = final_df[~((duplicates) & (final_df['team'].notna()))]
df_filtered['rebounds'] = df_filtered['offensive_rebounds']+df_filtered['defensive_rebounds']
# Assuming final_df is already defined with columns like 'games_played', 'points', etc.
# First aggregate the totals
total_stats = df_filtered.groupby('name').agg({
    'games_played': 'sum',
    'points': 'sum',
    'assists': 'sum',
    'rebounds': 'sum',
    'attempted_field_goals': 'sum',
    'made_field_goals': 'sum',
    'made_three_point_field_goals': 'sum',
    'attempted_three_point_field_goals': 'sum'
}).rename(columns={
    'games_played': 'total_games',
    'points': 'total_points',
    'assists': 'total_assists',
    'rebounds': 'total_rebounds',
    'attempted_field_goals': 'total_field_goals_attempted',
    'made_field_goals': 'total_field_goals_made',
    'made_three_point_field_goals': 'total_three_made',
    'attempted_three_point_field_goals': 'total_three_attempted'
})

# Then calculate the per-game values
df_filtered_over_25_games = df_filtered[df_filtered['games_played'] >= 25]
per_game_stats = df_filtered_over_25_games.groupby('name').agg({
    'points': lambda x: max(x / final_df.loc[x.index, 'games_played']),  # max PPG
    'assists': lambda x: max(x / final_df.loc[x.index, 'games_played']),  # max APG
    'rebounds': lambda x: max(x / final_df.loc[x.index, 'games_played']),  # max RPG
    'made_field_goals': lambda x: max(x / final_df.loc[x.index, 'attempted_field_goals']),  # max FGP
    'made_three_point_field_goals': lambda x: max(x / final_df.loc[x.index, 'attempted_three_point_field_goals'])  # max 3PP
}).rename(columns={
    'points': 'max_ppg',
    'assists': 'max_apg',
    'rebounds': 'max_rpg',
    'made_field_goals': 'max_fgp',
    'made_three_point_field_goals': 'max_3pp'
})

# Now, merge the total and per-game stats
total_stats = total_stats.join(per_game_stats)

total_stats_filtered = total_stats[
    (total_stats['total_games'] > 100) & 
    ((total_stats['max_ppg'] > 20) | 
     (total_stats['max_apg'] > 5) | 
     (total_stats['max_rpg'] > 10))
]

total_stats_filtered['avg_ppg'] = total_stats_filtered['total_points']/total_stats_filtered['total_games']
total_stats_filtered['avg_rpg'] = total_stats_filtered['total_rebounds']/total_stats_filtered['total_games']
total_stats_filtered['avg_apg'] = total_stats_filtered['total_assists']/total_stats_filtered['total_games']


#TODO: Save to database


#TODO: Get player headshots
test = get_stats("LeBron James")

for player in players:
    stats = get_stats(player)
    photo = get_player_headshot(player)
    
    print(stats)

# Create a DataFrame from the list of stats
df = pd.concat(data, ignore_index=True)


