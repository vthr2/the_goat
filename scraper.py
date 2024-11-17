import pandas as pd
from basketball_reference_web_scraper import client
from datetime import datetime
import requests
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

#for year in years_array:
#    print("getting data for year",year)
#    time.sleep(6)
#    data = client.players_advanced_season_totals(season_end_year=year)
#    df = pd.DataFrame(data)
#    all_data_advanced = pd.concat([all_data_advanced, df], ignore_index=True)

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

total_stats = df_filtered.groupby('slug').agg({
    'name': 'max',
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

# Combine seasons for players that were traded
advanced_df_cleaned = advanced_df.groupby(['slug','age']).agg({
    'name': 'max',
    'player_efficiency_rating': 'mean',
    'true_shooting_percentage': 'mean',
    'value_over_replacement_player': 'mean',
    'offensive_box_plus_minus': 'mean',
    'defensive_box_plus_minus': 'mean',
    'win_shares': 'mean',
    'games_played': 'sum'
}).reset_index()


# Don't count seasons where player played less than 10 games
advanced_df_filtered = advanced_df_cleaned[advanced_df_cleaned['games_played'] > 10]
# Compute both average and maximum for each column
total_advanced_stats = advanced_df_filtered.groupby('slug').agg({
    'player_efficiency_rating': ['mean', 'max'],
    'true_shooting_percentage': ['mean', 'max'],
    'value_over_replacement_player': ['mean', 'max'],
    'offensive_box_plus_minus': ['mean', 'max'],
    'defensive_box_plus_minus': ['mean', 'max'],
    'win_shares': ['mean', 'max'],
})

# Rename columns for clarity
total_advanced_stats.columns = [
    'Average_PER', 'Max_PER',
    'Average_TS', 'Max_TS',
    'Average_VORP', 'Max_VORP',
    'Average_OBP', 'Max_OBP',
    'Average_DBP', 'Max_DBP',
    'Average_Win_shares', 'Max_Win_shares'
]

# Reset index to make it a flat DataFrame
total_advanced_stats.reset_index(inplace=True)

# Then calculate the per-game values
df_filtered_over_25_games = df_filtered[df_filtered['games_played'] >= 25]
per_game_stats = df_filtered_over_25_games.groupby('slug').agg({
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
total_stats_filtered['field_goal_percentage'] = total_stats_filtered['total_field_goals_made']/total_stats_filtered['total_field_goals_attempted']
total_stats_filtered['three_point_percentage'] = total_stats_filtered['total_three_made']/total_stats_filtered['total_three_attempted']

final_dataset = total_stats_filtered.merge(total_advanced_stats, how = 'inner', on = 'slug')


# Get player headshot from basketball reference
base_url = 'https://www.basketball-reference.com/req/202106291/images/headshots/'

# Correct the typo in the column name and generate the headshot URL
base_url = 'https://www.basketball-reference.com/req/202106291/images/headshots/'

# Ensure the column name is corrected
final_dataset['headshot'] = base_url + final_dataset['slug'] + '.jpg'

# Function to check if the headshot exists
def image_exists(url):
    try:
        response = requests.head(url)
        return response.status_code == 200
    except requests.RequestException:
        return False

# Filter out players whose headshot image does not exist
final_dataset['headshot_exists'] = final_dataset['headshot'].apply(image_exists)
final_dataset_filtered = final_dataset[final_dataset['headshot_exists']]

# Remove the 'headshot_exists' column as it's no longer needed
final_dataset_filtered = final_dataset_filtered.drop(columns=['headshot_exists'])

#TODO: Save to database, for now we save to csv file
final_dataset.to_csv('nba_player_data.csv')



