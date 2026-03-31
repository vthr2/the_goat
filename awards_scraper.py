"""
awards_scraper.py
Uses nba_api (official NBA stats API) to fetch award data — no web scraping.

Awards fetched via PlayerAwards endpoint (one call per player):
  MVP, DPOY, 6MOY, Finals MVP, All-Star, Championship

Output: awards_summary.csv
"""

import time
from collections import defaultdict

import pandas as pd
from nba_api.stats.endpoints import CommonAllPlayers, PlayerAwards


# ── Required headers for stats.nba.com ────────────────────────────────────

NBA_HEADERS = {
    'Host': 'stats.nba.com',
    'User-Agent': (
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
        'AppleWebKit/537.36 (KHTML, like Gecko) '
        'Chrome/124.0.0.0 Safari/537.36'
    ),
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'x-nba-stats-origin': 'stats',
    'x-nba-stats-token': 'true',
    'Referer': 'https://www.nba.com/',
    'Origin': 'https://www.nba.com',
    'Connection': 'keep-alive',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-site',
}


# ── Load player list ───────────────────────────────────────────────────────

player_data  = pd.read_csv('nba_player_data.csv')
valid_names  = set(player_data['name'])
name_to_slug = dict(zip(player_data['name'], player_data['slug']))


# ── Award classification ───────────────────────────────────────────────────
# Exact DESCRIPTION values from the NBA API (verified against live data):
#   "NBA Most Valuable Player"
#   "NBA Defensive Player of the Year"  (may vary slightly)
#   "Sixth Man of the Year Award"
#   "NBA Finals Most Valuable Player"
#   "NBA All-Star"                      (exact — excludes "NBA All-Star Most Valuable Player")
#   "NBA Champion"
#
# Order matters: "Finals" must be checked before "Most Valuable Player"
# so the Finals MVP doesn't accidentally count as a regular MVP.

AWARD_KEYWORDS = [
    ('NBA Finals Most Valuable Player', 'finals_mvp'),
    ('NBA Most Valuable Player',         'mvp'),
    ('Defensive Player of the Year',     'dpoy'),
    ('Sixth Man',                        'sixmoy'),
    ('NBA Champion',                     'champion'),
    # All-Star is handled with an exact match below to exclude All-Star MVP
]

def classify(desc):
    if desc == 'NBA All-Star':
        return 'allstar'
    for keyword, field in AWARD_KEYWORDS:
        if keyword in desc:
            return field
    return None


# ── Initialize counts ──────────────────────────────────────────────────────

counts = defaultdict(lambda: {
    'mvp': 0, 'dpoy': 0, 'sixmoy': 0,
    'finals_mvp': 0, 'allstar': 0, 'champion': 0,
})


# ── Step 1: Match players to NBA API IDs ───────────────────────────────────

print("Step 1: Fetching NBA player list...")
all_players_df = CommonAllPlayers(
    is_only_current_season=0,
    league_id='00',
    season='2024-25',
    headers=NBA_HEADERS,
    timeout=60,
).get_data_frames()[0]

our_players = (
    all_players_df[all_players_df['DISPLAY_FIRST_LAST'].isin(valid_names)]
    [['PERSON_ID', 'DISPLAY_FIRST_LAST']]
    .drop_duplicates('DISPLAY_FIRST_LAST')
    .reset_index(drop=True)
)
print(f"  Matched {len(our_players)} of {len(valid_names)} players.")

unmatched = valid_names - set(our_players['DISPLAY_FIRST_LAST'])
if unmatched:
    sample = sorted(unmatched)[:10]
    print(f"  Unmatched sample ({len(unmatched)} total): {sample}")


# ── Step 2: Fetch awards per player ───────────────────────────────────────

total = len(our_players)
print(f"\nStep 2: Fetching awards for {total} players (~{total*0.6/60:.0f} min)...")

for i, (_, row) in enumerate(our_players.iterrows(), 1):
    player_id   = int(row['PERSON_ID'])
    player_name = row['DISPLAY_FIRST_LAST']

    try:
        awards_df = PlayerAwards(
            player_id=player_id,
            headers=NBA_HEADERS,
            timeout=60,
        ).get_data_frames()[0]

        for _, award_row in awards_df.iterrows():
            field = classify(str(award_row.get('DESCRIPTION', '')))
            if field:
                counts[player_name][field] += 1

    except Exception as e:
        print(f"  [{i}/{total}] Error for {player_name}: {e}")

    if i % 50 == 0 or i == total:
        print(f"  Progress: {i}/{total}")

    time.sleep(0.6)

print("  Done.")


# ── Build output CSV ───────────────────────────────────────────────────────

print("\nBuilding awards_summary.csv...")
rows = []
for name, awards in counts.items():
    rows.append({
        'name':       name,
        'slug':       name_to_slug.get(name, ''),
        'mvp':        awards['mvp'],
        'dpoy':       awards['dpoy'],
        'sixmoy':     awards['sixmoy'],
        'finals_mvp': awards['finals_mvp'],
        'allstar':    awards['allstar'],
        'champion':   awards['champion'],
    })

df = pd.DataFrame(rows).sort_values('name').reset_index(drop=True)
df.to_csv('awards_summary.csv', index=False)
print(f"Saved awards_summary.csv — {len(df)} players with at least one award.")

# Sanity check
if not df.empty:
    cols = ['name', 'champion', 'mvp', 'finals_mvp', 'allstar', 'dpoy', 'sixmoy']
    top = df.sort_values('allstar', ascending=False).head(8)[cols]
    print("\nTop 8 by All-Star appearances:")
    print(top.to_string(index=False))

print("\nDone!")
