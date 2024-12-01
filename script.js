let players = [];
let selectedPlayers = []; // To track selected players
let displayedPlayers = []; // To store the displayed random players

// Fetch player data and display the random players
fetch('nba_player_data.csv')
  .then(response => response.text())
  .then(data => {
    players = parseCSV(data);
    displayRandomPlayers();
    updateRankingsDisplay(); // Update rankings when data is loaded
  })
  .catch(error => console.error('Error loading player data:', error));

// Function to parse CSV into an array of objects
function parseCSV(data) {
  const rows = data.split('\n');
  const headers = rows[0].split(',').map(header => header.trim()); // Get headers from the first row
  const dataRows = rows.slice(1).filter(row => row.trim() !== ''); // Exclude the header and empty rows

  // Get column indices based on column names
  const nameIndex = headers.indexOf('name');
  const avgPpgIndex = headers.indexOf('avg_ppg');
  const avgRpgIndex = headers.indexOf('avg_rpg');
  const avgApgIndex = headers.indexOf('avg_apg');
  const headshotIndex = headers.indexOf('headshot'); // Get the index of the headshot column

  // Parse each row into an object
  return dataRows.map(row => {
    const columns = row.split(',');
    return {
      name: columns[nameIndex]?.trim(),
      avg_ppg: parseFloat(columns[avgPpgIndex]) || 0, // Default to 0 if value is missing
      avg_rpg: parseFloat(columns[avgRpgIndex]) || 0,
      avg_apg: parseFloat(columns[avgApgIndex]) || 0,
      headshot: columns[headshotIndex]?.trim(), // Get the headshot URL
    };
  });
}

// Function to select two random players
function getRandomPlayers() {
  const shuffled = players.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 2);
}

// Function to display two random players
function displayRandomPlayers() {
  const playerCardsDiv = document.getElementById('player-cards');
  playerCardsDiv.innerHTML = ''; // Clear previous cards

  displayedPlayers = getRandomPlayers(); // Store the displayed players

  [displayedPlayers[0], displayedPlayers[1]].forEach((player, index) => {
    const card = document.createElement('div');
    card.className = 'player-card';
    card.innerHTML = `
      <div class="card-content">
        <img src="${player.headshot}" alt="${player.name}" class="headshot">
        <div class="info">
          <h2>${player.name}</h2>
          <p><strong>PPG:</strong> ${player.avg_ppg.toFixed(1)}</p>
          <p><strong>APG:</strong> ${player.avg_apg.toFixed(1)}</p>
          <p><strong>RPG:</strong> ${player.avg_rpg.toFixed(1)}</p>
        </div>
        <button class="button-select" onclick="onPlayerSelect(${index})">Select</button>
      </div>
    `;
    playerCardsDiv.appendChild(card);
  });
}

// Function to handle player selection and update ELO
function onPlayerSelect(selectedIndex) {
  // Use the stored displayed players
  const winner = displayedPlayers[selectedIndex];  // The selected player is the winner
  const loser = displayedPlayers[selectedIndex === 0 ? 1 : 0];  // The unselected player is the loser
  
  // Now add both players to the selectedPlayers array
  selectedPlayers = [winner, loser];

  // Send the ELO update request
  fetch('http://127.0.0.1:5000/update-elo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      winnerName: winner.name,
      loserName: loser.name,
    }),
  })
  .then(response => response.json())
  .then(data => {
    console.log('ELO updated successfully:', data);
    alert(`ELO updated: ${winner.name} (Winner) and ${loser.name} (Loser)`);

    // Clear the selected players and display new random players
    selectedPlayers = [];
    displayRandomPlayers();  // Load new players
    updateRankingsDisplay(); // Update rankings after each ELO change
  })
  .catch(error => {
    console.error('Error updating ELO:', error);
    alert('Error updating ELO.');
  });
}

// Function to display the rankings on the scoreboard
function updateRankingsDisplay() {
  fetch('http://127.0.0.1:5000/rankings')
    .then(response => response.json())
    .then(rankings => {
      const rankingsDiv = document.getElementById('rankings');
      const rankingsList = rankingsDiv.querySelector('div') || document.createElement('div');
      rankingsDiv.appendChild(rankingsList);
      rankingsList.innerHTML = ''; // Clear previous rankings

      rankings.forEach(player => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'ranking-player';
        playerDiv.innerHTML = `
          <h3>${player[0]}</h3> <!-- Player name -->
          <p>ELO: ${player[1].toFixed(0)}</p> <!-- ELO rating -->
        `;
        rankingsList.appendChild(playerDiv);
      });
    })
    .catch(error => console.error('Error fetching rankings:', error));
}

// Call this function to update rankings after ELO update or page load
updateRankingsDisplay();
