from flask import Flask, request, jsonify, send_from_directory  # Added send_from_directory
from flask_cors import CORS
import sqlite3
import csv
import os  # Added for path handling

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
                elo_rating REAL NOT NULL DEFAULT 1200
            )
        """)
        conn.commit()

# Serve the index.html file at the root URL
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

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

        # Update database with new ELO ratings
        cursor.execute("""
            UPDATE player_rankings
            SET elo_rating = CASE
                WHEN name = ? THEN ?
                WHEN name = ? THEN ?
            END
            WHERE name IN (?, ?)
        """, (winner_name, new_winner_rating, loser_name, new_loser_rating, winner_name, loser_name))

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
        cursor.execute("SELECT name, elo_rating FROM player_rankings ORDER BY elo_rating DESC")
        rankings = cursor.fetchall()
    return jsonify(rankings)

# Main entry point to initialize the DB and run the app
if __name__ == '__main__':
    init_db()
    app.run(debug=True)