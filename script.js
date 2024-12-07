let players = [];
let displayedPlayers = [];
let showAdvancedStats = false;
let showCareerHighs = false;
let selectedPlayers = [];

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

// Function to select two random players
function getRandomPlayers() {
  const shuffled = [...players].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 2);
}

// Function to display two random players
function displayRandomPlayers(shuffle = true) {
  const playerCardsDiv = document.getElementById('player-cards');
  playerCardsDiv.innerHTML = '';
  if (shuffle) {
    displayedPlayers = getRandomPlayers();
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
  });

  const toggleStatsButton = document.createElement('button');
  toggleStatsButton.className = 'toggle-button';
  toggleStatsButton.innerText = showAdvancedStats ? 'Show Regular Stats' : 'Show Advanced Stats';
  toggleStatsButton.onclick = toggleStatsView;
  playerCardsDiv.appendChild(toggleStatsButton);

  const toggleHighsButton = document.createElement('button');
  toggleHighsButton.className = 'toggle-button';
  toggleHighsButton.innerText = showCareerHighs ? 'Show Career Averages' : 'Show Career Highs';
  toggleHighsButton.onclick = toggleCareerHighs;
  playerCardsDiv.appendChild(toggleHighsButton);
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

// Function to handle player selection and update ELO
function onPlayerSelect(selectedIndex) {
  const winner = displayedPlayers[selectedIndex];
  const loser = displayedPlayers[selectedIndex === 0 ? 1 : 0];

  selectedPlayers = [winner, loser];

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

      selectedPlayers = [];
      displayRandomPlayers();
      updateRankingsDisplay();
    })
    .catch(error => {
      console.error('Error updating ELO:', error);
      alert('Error updating ELO.');
    });
}

// Function to update and show rankings in the 'Rankings' tab
function updateRankingsDisplay() {
  fetch('http://127.0.0.1:5000/rankings')
    .then(response => response.json())
    .then(rankings => {
      const rankingsDiv = document.getElementById('rankings-list');
      rankingsDiv.innerHTML = '';

      rankings.forEach((player, index) => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'ranking-player';

        let medalIcon = '';
        let goatIcon = '';
        
        if (index === 0) {
          goatIcon = '<span class="goat">🐐</span>';
          medalIcon = '<span class="medal">🥇</span>';
        } else if (index === 1) {
          medalIcon = '<span class="medal second">🥈</span>';
        } else if (index === 2) {
          medalIcon = '<span class="medal third">🥉</span>';
        }

        playerDiv.innerHTML = `
          <h3>${goatIcon}${medalIcon}${player[0]}</h3>
          <p>ELO: ${player[1].toFixed(0)}</p>
        `;
        rankingsDiv.appendChild(playerDiv);
      });
    })
    .catch(error => console.error('Error fetching rankings:', error));
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
