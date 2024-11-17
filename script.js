// Fetch the CSV file and parse the data
let players = [];

fetch('nba_player_data.csv')
  .then(response => response.text())
  .then(data => {
    players = parseCSV(data);
    displayRandomPlayers();
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

  // Parse each row into an object
  return dataRows.map(row => {
    const columns = row.split(',');
    return {
      name: columns[nameIndex]?.trim(),
      avg_ppg: parseFloat(columns[avgPpgIndex]) || 0, // Default to 0 if value is missing
      avg_rpg: parseFloat(columns[avgRpgIndex]) || 0,
      avg_apg: parseFloat(columns[avgApgIndex]) || 0,
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

  const [player1, player2] = getRandomPlayers();

  [player1, player2].forEach((player, index) => {
    const card = document.createElement('div');
    card.className = 'player-card';
    card.innerHTML = `
      <h2>${player.name}</h2>
      <p><strong>PPG:</strong> ${player.avg_ppg.toFixed(1)}</p>
      <p><strong>APG:</strong> ${player.avg_apg.toFixed(1)}</p>
      <p><strong>RPG:</strong> ${player.avg_rpg.toFixed(1)}</p>
      <button class="button-select" onclick="onPlayerSelect(${index})">Select</button>
    `;
    playerCardsDiv.appendChild(card);
  });
}

// Function to handle player selection
function onPlayerSelect(selectedIndex) {
  alert(`You selected Player ${selectedIndex + 1}`);
  displayRandomPlayers(); // Load new players
}
