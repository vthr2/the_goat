let players = [];
let displayedPlayers = [];
let showAdvancedStats = false;
let showCareerHighs = false;
let selectedPlayers = [];
let winnerStays = true;
let winner;

// Attach the event listener to the button
const toggleWinnerStaysButton = document.getElementById('toggle-game-mode');
toggleWinnerStaysButton.onclick = toggleGameMode; // Use the toggleGameMode function

// Fetch player data and display random players
fetch('nba_player_data.csv')
  .then(response => response.text())
  .then(data => {
    players = parseCSV(data);
    displayRandomPlayers(); // Initial display of random players
    updateRankingsDisplay(); // Update rankings when data is loaded
  })
  .catch(error => console.error('Error loading player data:', error));

// Parse CSV into an array of objects
function parseCSV(data) {
  const rows = data.split('\n');
  const headers = rows[0].split(',').map(header => header.trim()); // Get headers from the first row
  const dataRows = rows.slice(1).filter(row => row.trim() !== ''); // Exclude the header and empty rows

  const indices = headers.reduce((acc, header, index) => {
    acc[header] = index;
    return acc;
  }, {});

  return dataRows.map(row => {
    const columns = row.split(',');
    return {
      name: columns[indices['name']]?.trim(),
      avg_ppg: parseFloat(columns[indices['avg_ppg']]) || 0,
      max_ppg: parseFloat(columns[indices['max_ppg']]) || 0,
      avg_rpg: parseFloat(columns[indices['avg_rpg']]) || 0,
      max_rpg: parseFloat(columns[indices['max_rpg']]) || 0,
      avg_apg: parseFloat(columns[indices['avg_apg']]) || 0,
      max_apg: parseFloat(columns[indices['max_apg']]) || 0,
      field_goal_percentage: parseFloat(columns[indices['field_goal_percentage']]) || 0,
      max_fgp: parseFloat(columns[indices['max_fgp']]) || 0,
      three_point_percentage: parseFloat(columns[indices['three_point_percentage']]) || 0,
      max_3pp: parseFloat(columns[indices['max_3pp']]) || 0,
      Average_PER: parseFloat(columns[indices['Average_PER']]) || 0,
      Max_PER: parseFloat(columns[indices['Max_PER']]) || 0,
      Average_TS: parseFloat(columns[indices['Average_TS']]) || 0,
      Max_TS: parseFloat(columns[indices['Max_TS']]) || 0,
      Average_VORP: parseFloat(columns[indices['Average_VORP']]) || 0,
      Max_VORP: parseFloat(columns[indices['Max_VORP']]) || 0,
      Average_OBP: parseFloat(columns[indices['Average_OBP']]) || 0,
      Max_OBP: parseFloat(columns[indices['Max_OBP']]) || 0,
      Average_DBP: parseFloat(columns[indices['Average_DBP']]) || 0,
      Max_DBP: parseFloat(columns[indices['Max_DBP']]) || 0,
      Average_Win_shares: parseFloat(columns[indices['Average_Win_shares']]) || 0,
      Max_Win_shares: parseFloat(columns[indices['Max_Win_shares']]) || 0,
      headshot: columns[indices['headshot']]?.trim(),
    };
  });
}


let seasonStats = []; // New variable to store the season stats

// Fetch season stats data (assuming CSV format)
fetch('season_averages.csv')
  .then(response => response.text())
  .then(data => {
    seasonStats = parseSeasonCSV(data); // Parse the new CSV
    console.log("season statistics")
    console.log(seasonStats)
  })
  .catch(error => console.error('Error loading season stats data:', error));

// Function to parse the season stats CSV
function parseSeasonCSV(data) {
  const rows = data.split('\n');
  const headers = rows[0].split(',').map(header => header.trim()); // Get headers
  const dataRows = rows.slice(1).filter(row => row.trim() !== ''); // Exclude header and empty rows

  const indices = headers.reduce((acc, header, index) => {
    acc[header] = index;
    return acc;
  }, {});

  return dataRows.map(row => {
    const columns = row.split(',');
    return {
      name: columns[indices['name']]?.trim(),
      team: columns[indices['TEAM_ABBREVIATION']]?.trim(),
      season: columns[indices['SEASON_ID']]?.trim(),
      ppg: parseFloat(columns[indices['PPG']]) || 0,
      rpg: parseFloat(columns[indices['RPG']]) || 0,
      apg: parseFloat(columns[indices['APG']]) || 0,
      fgp: parseFloat(columns[indices['FG_PCT']])*100 || 0,
      tpp: parseFloat(columns[indices['FG_3PCT']])*100 || 0,
    };
  });
}


// Function to display season stats of the selected player
function displaySeasonStats(playerName, containerDiv) {
  containerDiv.innerHTML = ''; // Clear previous stats

  // Filter season stats for the selected player
  const playerSeasonStats = seasonStats.filter(stat => stat.name === playerName);
  if (playerSeasonStats.length === 0) {
    containerDiv.innerHTML = '<p>No season stats available for this player.</p>';
    return;
  }

  // Display season stats
  const statsTable = document.createElement('table');
  const headerRow = document.createElement('tr');
  headerRow.innerHTML = `<th>Season</th><th>Team</th><th>PPG</th><th>RPG</th><th>APG</th><th>FG%</th><th>3P%</th>`;
  statsTable.appendChild(headerRow);

  playerSeasonStats.forEach(stat => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${stat.season}</td>
      <td>${stat.team}</td>
      <td>${stat.ppg.toFixed(1)}</td>
      <td>${stat.rpg.toFixed(1)}</td>
      <td>${stat.apg.toFixed(1)}</td>
      <td>${(stat.fgp).toFixed(1)}%</td>
      <td>${(stat.tpp).toFixed(1)}%</td>
    `;
    statsTable.appendChild(row);
  });

  containerDiv.appendChild(statsTable);
}


// Function to check if an image URL is valid
function isImageValid(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(true);  // Image loaded successfully
    img.onerror = () => resolve(false);  // Image failed to load
    img.src = url;
  });
}

// Function to select two random players and check if their images are valid
async function getRandomPlayers() {
  let validPlayers = [];

  // If "Winner Stays" is active, add the winner to the pool
  if (winnerStays && winner) {
    validPlayers.push(winner); // Keep the previous winner
  }

  // Fetch new random players only if needed
  while (validPlayers.length < 2) {
    const randomPlayer = players[Math.floor(Math.random() * players.length)];

    // Ensure no duplicates
    if (validPlayers.some(p => p.name === randomPlayer.name)) {
      continue;
    }

    const isValid = await isImageValid(randomPlayer.headshot);
    if (isValid) {
      validPlayers.push(randomPlayer);
    }
  }

  return validPlayers;
}

async function displayRandomPlayers(shuffle = true) {
  const playerCardsDiv = document.getElementById('player-cards');
  playerCardsDiv.innerHTML = '';

  if (shuffle || displayedPlayers.length === 0) {
    displayedPlayers = await getRandomPlayers();
  }

  displayedPlayers.forEach((player, index) => {
    const card = document.createElement('div');
    card.className = 'player-card';

    const statsToShow = showCareerHighs ? {
      ppg: player.max_ppg,
      rpg: player.max_rpg,
      apg: player.max_apg,
      fgp: player.max_fgp,
      tpp: player.max_3pp,
      PER: player.Max_PER,
      TS: player.Max_TS,
      VORP: player.Max_VORP,
      OBP: player.Max_OBP,
      DBP: player.Max_DBP,
      WinShares: player.Max_Win_shares
    } : {
      ppg: player.avg_ppg,
      rpg: player.avg_rpg,
      apg: player.avg_apg,
      fgp: player.field_goal_percentage,
      tpp: player.three_point_percentage,
      PER: player.Average_PER,
      TS: player.Average_TS,
      VORP: player.Average_VORP,
      OBP: player.Average_OBP,
      DBP: player.Average_DBP,
      WinShares: player.Average_Win_shares
    };

    card.innerHTML = `
      <div class="card-content">
        <img src="${player.headshot}" alt="${player.name}" class="headshot">
        <div class="info">
          <h2>${player.name}</h2>
          ${showAdvancedStats ? `
          <p><strong>PER:</strong> ${statsToShow.PER.toFixed(1)}</p>
          <p><strong>Win Shares:</strong> ${statsToShow.WinShares.toFixed(1)}</p>
          <p><strong>OBP:</strong> ${statsToShow.OBP.toFixed(1)}</p>
          <p><strong>DBP:</strong> ${statsToShow.DBP.toFixed(1)}</p>
          <p><strong>VORP:</strong> ${statsToShow.VORP.toFixed(1)}</p>
          <p><strong>TS%:</strong> ${(statsToShow.TS * 100).toFixed(1)}%</p>
          ` : `
          <p><strong>PPG:</strong> ${statsToShow.ppg.toFixed(1)}</p>
          <p><strong>APG:</strong> ${statsToShow.apg.toFixed(1)}</p>
          <p><strong>RPG:</strong> ${statsToShow.rpg.toFixed(1)}</p>
          <p><strong>FG%:</strong> ${(statsToShow.fgp * 100).toFixed(1)}%</p>
          <p><strong>3P%:</strong> ${(statsToShow.tpp * 100).toFixed(1)}%</p>
          `}
        </div>
        <button class="button-select" onclick="onPlayerSelect(${index})">Select</button>
      </div>
    `;

    playerCardsDiv.appendChild(card);

    // Display season stats for the left and right player
    if (index === 0) {
      const leftStatsDiv = document.getElementById('left-player-stats-container');
      leftStatsDiv.innerHTML = ''; // Clear previous stats
      displaySeasonStats(player.name, leftStatsDiv);
    } else if (index === 1) {
      const rightStatsDiv = document.getElementById('right-player-stats-container');
      rightStatsDiv.innerHTML = ''; // Clear previous stats
      displaySeasonStats(player.name, rightStatsDiv);
    }
  });

  // Toggle buttons to change views (same as before)
  const toggleButtonsContainer = document.createElement('div');
  toggleButtonsContainer.className = 'toggle-buttons-container';

  const toggleStatsButton = document.createElement('button');
  toggleStatsButton.className = 'toggle-button';
  toggleStatsButton.innerText = showAdvancedStats ? 'Show Regular Stats' : 'Show Advanced Stats';
  toggleStatsButton.onclick = toggleStatsView;

  const toggleHighsButton = document.createElement('button');
  toggleHighsButton.className = 'toggle-button';
  toggleHighsButton.innerText = showCareerHighs ? 'Show Career Averages' : 'Show Career Highs';
  toggleHighsButton.onclick = toggleCareerHighs;

  toggleButtonsContainer.appendChild(toggleStatsButton);
  toggleButtonsContainer.appendChild(toggleHighsButton);

  playerCardsDiv.appendChild(toggleButtonsContainer);
}


// Function to toggle between regular and advanced stats
function toggleStatsView() {
  showAdvancedStats = !showAdvancedStats;
  displayRandomPlayers(false);
}

// Function to toggle between career highs and averages
function toggleCareerHighs() {
  showCareerHighs = !showCareerHighs;
  displayRandomPlayers(false);
}

function onPlayerSelect(selectedIndex) {
  const currentWinner = displayedPlayers[selectedIndex];
  const loser = displayedPlayers[selectedIndex === 0 ? 1 : 0];

  selectedPlayers = [currentWinner, loser];

  fetch('http://127.0.0.1:5000/update-elo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      winnerName: currentWinner.name,
      loserName: loser.name,
    }),
  })
    .then(response => response.json())
    .then(data => {
      console.log('ELO updated successfully:', data);

      // Update winner for the next round if "winner stays" mode is active
      if (winnerStays) {
        winner = currentWinner;
      } else {
        winner = null;
      }

      selectedPlayers = [];
      displayRandomPlayers();
      updateRankingsDisplay();
    })
    .catch(error => {
      console.error('Error updating ELO:', error);
      alert('Error updating ELO.');
    });
}


function updateRankingsDisplay() {
  fetch('http://127.0.0.1:5000/rankings')
    .then(response => response.json())
    .then(rankings => {
      const rankingsDiv = document.getElementById('rankings-list');
      rankingsDiv.innerHTML = '';

      rankings.forEach((player, index) => {
        const playerDiv = document.createElement('div');
        playerDiv.className = `ranking-player ${index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : ''}`;

        let medalIcon = '';
        let goatIcon = '';

        if (index === 0) {
          goatIcon = '<span class="goat">🐐</span>';
        } else if (index === 1) {
          medalIcon = '<span class="medal second">🥈</span>';
        } else if (index === 2) {
          medalIcon = '<span class="medal third">🥉</span>';
        }

        playerDiv.innerHTML = `
          <div class="player-ranking">
            <div class="player-info">
              <h3>${goatIcon}${medalIcon}${player[0]}</h3>
              <p>ELO: ${player[1].toFixed(0)}</p>
            </div>
          </div>
        `;
        rankingsDiv.appendChild(playerDiv);
      });
    })
    .catch(error => console.error('Error fetching rankings:', error));
}


function toggleGameMode() {
  winnerStays = !winnerStays; // Toggle mode
  winner = null; // Reset winner when switching modes

  // Update button text dynamically
  const toggleButton = document.getElementById('toggle-game-mode');
  toggleButton.innerText = winnerStays ? 'Disable Winner Stays' : 'Enable Winner Stays';
}


// Switch between tabs
function switchTab(tabName) {
  // Hide all tab content
  const tabs = document.querySelectorAll('.tab-content');
  tabs.forEach(tab => tab.classList.remove('active'));

  // Show the selected tab
  const activeTab = document.getElementById(tabName);
  activeTab.classList.add('active');

  // Update the active tab link
  const links = document.querySelectorAll('nav a');
  links.forEach(link => link.classList.remove('active'));
  
  // Activate the clicked tab link
  const activeLink = document.querySelector(`a[href='#'][onclick="switchTab('${tabName}')"]`);
  if (activeLink) {
    activeLink.classList.add('active');
  }
}
