import pandas as pd
from basketball_reference_web_scraper import client
from basketball_reference_web_scraper.data import OutputType 
from datetime import datetime

#hugmyndir
# flipi fyrir honours og advanced stats byrjum með total averages
# Loop over each year since start of nba

# Sækja player season totals fyrir allar seasons frá 1950 

current_year = datetime.now().year

years_array = list(range(1950, (current_year+1)))  # 2025 is used as the end to include 2024

all_data = pd.DataFrame()

for year in years_array:
    print("getting data for year",year)
    data = client.players_season_totals(season_end_year=year)
    df = pd.DataFrame(data)
    all_data = pd.concat([all_data, df], ignore_index=True)


# Concatenate all DataFrames in the list into a single DataFrame
final_df = pd.concat(all_data, ignore_index=True)

# Assuming final_df is already defined with columns like 'games_played', 'points', etc.
total_stats = final_df.groupby('name').agg({
    'games_played': 'sum',
    'points': 'sum',
    'assists': 'sum',
    'rebounds': 'sum',
    'attempted_field_goals': 'sum',
    'made_field_goals': 'sum',
    'made_three_point_field_goals': 'sum',
    'attempted_three_point_field_goals': 'sum',
    'points': lambda x: max(x / final_df.loc[x.index, 'games_played']),  # max PPG
    'assists': lambda x: max(x / final_df.loc[x.index, 'games_played']),  # max APG
    'rebounds': lambda x: max(x / final_df.loc[x.index, 'games_played']),  # max RPG
    'made_field_goals': lambda x: max(x / final_df.loc[x.index, 'attempted_field_goals']),  # max FGP
    'made_three_point_field_goals': lambda x: max(x / final_df.loc[x.index, 'attempted_three_point_field_goals'])  # max 3PP
}).rename(columns={
    'games_played': 'total_games',
    'points': 'total_points',
    'assists': 'total_assists',
    'rebounds': 'total_rebounds',
    'attempted_field_goals': 'total_field_goals_attempted',
    'made_field_goals': 'total_field_goals_made',
    'made_three_point_field_goals': 'total_three_made',
    'attempted_three_point_field_goals': 'total_three_attempted',
    'points': 'max_ppg',
    'assists': 'max_apg',
    'rebounds': 'max_rpg',
    'made_field_goals': 'max_fgp',
    'made_three_point_field_goals': 'max_3pp'
})

total_stats_filtered = total_stats[
    (total_stats['total_games'] > 100) & 
    ((total_stats['max_ppg'] > 20) | 
     (total_stats['max_apg'] > 5) | 
     (total_stats['max_rpg'] > 10))
]


print(total_stats)





#TODO Get Names of toop 500 nba players...
players = ['LeBron James', 'Kevin Durant']  # List of player names
# Input random player from players
# Return stats and photo
# Create player card from stats and photo
# Loop through each player and each season to fetch stats
test = get_stats("LeBron James")

for player in players:
    stats = get_stats(player)
    photo = get_player_headshot(player)
    
    print(stats)

# Create a DataFrame from the list of stats
df = pd.concat(data, ignore_index=True)


