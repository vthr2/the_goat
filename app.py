from flask import Flask, request, jsonify, send_from_directory  # Added send_from_directory
from flask_cors import CORS
import sqlite3
import csv
import pandas as pd

app = Flask(__name__)
CORS(app)

# Initialize database
def init_db():
    with sqlite3.connect("nba_game.db") as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS player_rankings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                authenticator TEXT UNIQUE NOT NULL,
                name TEXT UNIQUE NOT NULL,
                elo_rating REAL NOT NULL DEFAULT 1200,
                wins INTEGER NOT NULL DEFAULT 0,
                losses INTEGER NOT NULL DEFAULT 0
            )
        """)
        cursor.execute("PRAGMA table_info(player_rankings)")
        columns = [col[1] for col in cursor.fetchall()]
        if 'wins' not in columns:
            cursor.execute("ALTER TABLE player_rankings ADD COLUMN wins INTEGER NOT NULL DEFAULT 0")
        if 'losses' not in columns:
            cursor.execute("ALTER TABLE player_rankings ADD COLUMN losses INTEGER NOT NULL DEFAULT 0")
        conn.commit()

# Serve the index.html file at the root URL
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_root_files(filename):
    return send_from_directory('.', filename)

# Route to load players from CSV into the database (Insert only if players do not exist)
@app.route('/load-players', methods=['POST'])
def load_players():
    file_path = request.json.get('file_path', 'nba_player_data.csv')  # Default CSV file name
    try:
        with sqlite3.connect("nba_game.db") as conn:
            cursor = conn.cursor()
            with open(file_path, 'r') as csvfile:
                reader = csv.reader(csvfile)
                next(reader)  # Skip the header row
                for row in reader:
                    player_name = row[2].strip()
                    player_authenticator = row[1].strip()            
                    cursor.execute("""
                        INSERT OR IGNORE INTO player_rankings (authenticator, name)
                        VALUES (?, ?)
                    """, (player_authenticator, player_name))

            conn.commit()
        print_table()  # Print table after insertion (For debugging)

        return jsonify({'message': 'Players loaded successfully from CSV!'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Route to update ELO rankings after a vote
@app.route('/update-elo', methods=['POST'])
def update_elo():
    data = request.json
    winner_name = data['winnerName']
    loser_name = data['loserName']
    K = 32  # Constant for ELO calculation

    with sqlite3.connect("nba_game.db") as conn:
        cursor = conn.cursor()

        # Get current ELO ratings
        cursor.execute("SELECT name, elo_rating FROM player_rankings WHERE name IN (?, ?)", (winner_name, loser_name))
        players = cursor.fetchall()

        if len(players) != 2:
            return jsonify({'error': 'Player not found'}), 400

        winner = next(player for player in players if player[0] == winner_name)
        loser = next(player for player in players if player[0] == loser_name)

        # ELO calculation
        expected_winner = 1 / (1 + 10 ** ((loser[1] - winner[1]) / 400))
        expected_loser = 1 / (1 + 10 ** ((winner[1] - loser[1]) / 400))

        new_winner_rating = winner[1] + K * (1 - expected_winner)
        new_loser_rating = loser[1] + K * (0 - expected_loser)

        # Update database with new ELO ratings, wins, and losses
        cursor.execute("""
            UPDATE player_rankings
            SET elo_rating = CASE WHEN name = ? THEN ? WHEN name = ? THEN ? END,
                wins = CASE WHEN name = ? THEN wins + 1 ELSE wins END,
                losses = CASE WHEN name = ? THEN losses + 1 ELSE losses END
            WHERE name IN (?, ?)
        """, (winner_name, new_winner_rating, loser_name, new_loser_rating,
              winner_name, loser_name, winner_name, loser_name))

        conn.commit()

    return jsonify({'message': 'ELO updated successfully'})

# Route to print all player rankings (For debugging)
def print_table():
    with sqlite3.connect("nba_game.db") as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM player_rankings")
        rows = cursor.fetchall()
        for row in rows:
            print(row)

# Route to get current player rankings (sorted by ELO)
@app.route('/rankings', methods=['GET'])
def get_rankings():
    with sqlite3.connect("nba_game.db") as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT name, elo_rating, wins, losses FROM player_rankings ORDER BY elo_rating DESC")
        rankings = [{'name': r[0], 'elo': r[1], 'wins': r[2], 'losses': r[3]} for r in cursor.fetchall()]
    return jsonify(rankings)

# Route to get site stats
@app.route('/stats', methods=['GET'])
def get_stats():
    with sqlite3.connect("nba_game.db") as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT SUM(wins) FROM player_rankings")
        total_votes = cursor.fetchone()[0] or 0
        cursor.execute("SELECT name, wins, losses FROM player_rankings WHERE wins + losses > 0 ORDER BY wins + losses DESC LIMIT 10")
        most_voted = [{'name': r[0], 'wins': r[1], 'losses': r[2], 'appearances': r[1] + r[2]} for r in cursor.fetchall()]
        cursor.execute("SELECT name, wins, losses FROM player_rankings WHERE wins + losses >= 10 ORDER BY CAST(wins AS FLOAT) / (wins + losses) DESC LIMIT 10")
        best_win_rate = [{'name': r[0], 'wins': r[1], 'losses': r[2], 'win_rate': round(r[1] / (r[1] + r[2]) * 100, 1)} for r in cursor.fetchall()]
    return jsonify({'total_votes': total_votes, 'most_voted': most_voted, 'best_win_rate': best_win_rate})

# Route to get player awards (loaded from awards_summary.csv)
@app.route('/awards', methods=['GET'])
def get_awards():
    try:
        df = pd.read_csv('awards_summary.csv')
        awards_dict = {}
        for _, row in df.iterrows():
            awards_dict[row['name']] = {
                'mvp':        int(row['mvp']),
                'dpoy':       int(row['dpoy']),
                'sixmoy':     int(row['sixmoy']),
                'finals_mvp': int(row['finals_mvp']),
                'allstar':    int(row['allstar']),
                'champion':   int(row['champion']),
            }
        return jsonify(awards_dict)
    except FileNotFoundError:
        return jsonify({})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Main entry point to initialize the DB and run the app
if __name__ == '__main__':
    init_db()
    app.run(debug=True)