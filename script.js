let players = [];
let displayedPlayers = [];
let showAdvancedStats = false;
let showCareerHighs = false;
let selectedPlayers = [];
let winnerStays = true;
let winner;
let playerAwards = {};
let seasonStats = [];
let topN = null;
let rankedPlayerNames = [];

const toggleWinnerStaysButton = document.getElementById('toggle-game-mode');
toggleWinnerStaysButton.onclick = toggleGameMode;

// Fix 1: Use Promise.all to ensure ALL data is loaded before rendering
Promise.all([
  fetch('/awards').then(res => res.json()).catch(e => { console.error('Error loading awards:', e); return {}; }),
  fetch('/static/nba_player_data.csv').then(res => res.text()),
  fetch('/static/season_averages.csv').then(res => res.text())
]).then(([awardsData, playerData, seasonData]) => {
  playerAwards = awardsData;
  players = parseCSV(playerData);
  seasonStats = parseSeasonCSV(seasonData);
  
  displayRandomPlayers();
  updateRankingsDisplay();
}).catch(error => console.error('Error loading initial data:', error));

function parseCSV(data) {
  const rows = data.split('\n');
  const headers = rows[0].split(',').map(header => header.trim());
  const dataRows = rows.slice(1).filter(row => row.trim() !== '');

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

function parseSeasonCSV(data) {
  const rows = data.split('\n');
  const headers = rows[0].split(',').map(header => header.trim());
  const dataRows = rows.slice(1).filter(row => row.trim() !== '');

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
      tpp: parseFloat(columns[indices['FG3_PCT']])*100 || 0,
    };
  });
}

function displaySeasonStats(playerName, containerDiv) {
  containerDiv.innerHTML = '';
  const playerSeasonStats = seasonStats.filter(stat => stat.name === playerName);
  if (playerSeasonStats.length === 0) {
    containerDiv.innerHTML = `<p class="stats-panel-title">${playerName}</p><p style="text-align:center;color:var(--text-muted);font-size:13px;">No season data available.</p>`;
    return;
  }

  const title = document.createElement('p');
  title.className = 'stats-panel-title';
  title.textContent = playerName;
  containerDiv.appendChild(title);

  const statsTable = document.createElement('table');
  const headerRow = document.createElement('tr');
  headerRow.innerHTML = `<th>Season</th><th>Team</th><th>PPG</th><th>RPG</th><th>APG</th><th>FG%</th><th>3P%</th>`;
  statsTable.appendChild(headerRow);

  playerSeasonStats.forEach(stat => {
    const shortSeason = stat.season ? stat.season.slice(-5) : stat.season;
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${shortSeason}</td>
      <td>${stat.team}</td>
      <td>${stat.ppg.toFixed(1)}</td>
      <td>${stat.rpg.toFixed(1)}</td>
      <td>${stat.apg.toFixed(1)}</td>
      <td>${stat.fgp.toFixed(1)}%</td>
      <td>${stat.tpp.toFixed(1)}%</td>
    `;
    statsTable.appendChild(row);
  });
  containerDiv.appendChild(statsTable);
}

function buildAwardsHtml(playerName) {
  const a = playerAwards[playerName];
  if (!a) return '';
  const pills = [];
  if (a.champion   > 0) pills.push(`<span class="award-pill champion">🏆 ${a.champion}× Ring${a.champion > 1 ? 's' : ''}</span>`);
  if (a.mvp        > 0) pills.push(`<span class="award-pill mvp">🏅 ${a.mvp}× MVP</span>`);
  if (a.finals_mvp > 0) pills.push(`<span class="award-pill finals_mvp">🎯 ${a.finals_mvp}× Finals MVP</span>`);
  if (a.allstar    > 0) pills.push(`<span class="award-pill allstar">⭐ ${a.allstar}× All-Star</span>`);
  if (a.dpoy       > 0) pills.push(`<span class="award-pill dpoy">🛡️ ${a.dpoy}× DPOY</span>`);
  if (a.sixmoy     > 0) pills.push(`<span class="award-pill sixmoy">6️⃣ ${a.sixmoy}× 6MOY</span>`);
  return pills.length === 0 ? '' : `<div class="awards-row">${pills.join('')}</div>`;
}

function isImageValid(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

async function getRandomPlayers() {
  const pool = topN && rankedPlayerNames.length >= topN
    ? players.filter(p => rankedPlayerNames.slice(0, topN).includes(p.name))
    : players;
  let validPlayers = [];
  if (winnerStays && winner) validPlayers.push(winner);
  while (validPlayers.length < 2) {
    const randomPlayer = pool[Math.floor(Math.random() * pool.length)];
    if (validPlayers.some(p => p.name === randomPlayer.name)) continue;
    const isValid = await isImageValid(randomPlayer.headshot);
    if (isValid) validPlayers.push(randomPlayer);
  }
  return validPlayers;
}

async function displayRandomPlayers(shuffle = true) {
  // Fix 2: Wait for new players BEFORE clearing the DOM to prevent UI flicker
  let nextPlayers = displayedPlayers;
  if (shuffle || displayedPlayers.length === 0) {
    nextPlayers = await getRandomPlayers();
  }
  displayedPlayers = nextPlayers;

  const playersRow = document.getElementById('players-row');
  playersRow.innerHTML = ''; // Now it's safe to clear the screen

  displayedPlayers.forEach((player, index) => {
    const statsToShow = showCareerHighs ? {
      ppg: player.max_ppg, rpg: player.max_rpg, apg: player.max_apg,
      fgp: player.max_fgp, tpp: player.max_3pp,
      PER: player.Max_PER, TS: player.Max_TS, VORP: player.Max_VORP,
      OBP: player.Max_OBP, DBP: player.Max_DBP, WinShares: player.Max_Win_shares
    } : {
      ppg: player.avg_ppg, rpg: player.avg_rpg, apg: player.avg_apg,
      fgp: player.field_goal_percentage, tpp: player.three_point_percentage,
      PER: player.Average_PER, TS: player.Average_TS, VORP: player.Average_VORP,
      OBP: player.Average_OBP, DBP: player.Average_DBP, WinShares: player.Average_Win_shares
    };

    const card = document.createElement('div');
    card.className = 'player-card';
    card.innerHTML = `
      <div class="card-content">
        <img src="${player.headshot}" alt="${player.name}" class="headshot">
        <h2>${player.name}</h2>
        ${buildAwardsHtml(player.name)}
        <div class="card-stats">
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

    const statsPanel = document.createElement('div');
    statsPanel.className = 'stats-panel';
    displaySeasonStats(player.name, statsPanel);

    const unit = document.createElement('div');
    unit.className = 'player-unit';
    
    // STEP 1: Mirrored layout alignment
    if (index === 0) {
      unit.appendChild(statsPanel);
      unit.appendChild(card);
    } else {
      unit.appendChild(card);
      unit.appendChild(statsPanel);
    }

    playersRow.appendChild(unit);
  });

  const wrapper = document.getElementById('toggle-buttons-wrapper');
  wrapper.innerHTML = '';

  const toggleStatsButton = document.createElement('button');
  toggleStatsButton.className = 'toggle-button' + (showAdvancedStats ? ' active' : '');
  toggleStatsButton.innerText = showAdvancedStats ? 'Show Regular Stats' : 'Show Advanced Stats';
  toggleStatsButton.onclick = toggleStatsView;

  const toggleHighsButton = document.createElement('button');
  toggleHighsButton.className = 'toggle-button' + (showCareerHighs ? ' active' : '');
  toggleHighsButton.innerText = showCareerHighs ? 'Show Career Averages' : 'Show Career Highs';
  toggleHighsButton.onclick = toggleCareerHighs;

  wrapper.appendChild(toggleStatsButton);
  wrapper.appendChild(toggleHighsButton);
}

function setTopN(n) {
  if (topN === n) return;
  topN = n;
  winner = null;
  document.querySelectorAll('.top-n-btn').forEach(btn => btn.classList.remove('active'));
  const selector = n === null ? '.top-n-btn:first-child' : `.top-n-btn[onclick="setTopN(${n})"]`;
  document.querySelector(selector).classList.add('active');
  displayRandomPlayers();
}

function toggleStatsView() {
  showAdvancedStats = !showAdvancedStats;
  displayRandomPlayers(false);
}

function toggleCareerHighs() {
  showCareerHighs = !showCareerHighs;
  displayRandomPlayers(false);
}

function onPlayerSelect(selectedIndex) {
  const currentWinner = displayedPlayers[selectedIndex];
  const loser = displayedPlayers[selectedIndex === 0 ? 1 : 0];
  selectedPlayers = [currentWinner, loser];

  fetch('/update-elo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ winnerName: currentWinner.name, loserName: loser.name }),
  })
    .then(response => response.json())
    .then(() => {
      winner = winnerStays ? currentWinner : null;
      selectedPlayers = [];
      displayRandomPlayers();
      updateRankingsDisplay();
    })
    .catch(error => console.error('Error updating ELO:', error));
}

function updateRankingsDisplay() {
  fetch('/rankings')
    .then(response => {
      console.log("Rankings API response:", response);
      return response.json()})
    .then(rankings => {
      const rankingsDiv = document.getElementById('rankings-list');
      rankingsDiv.innerHTML = '';

      rankedPlayerNames = rankings.map(r => r.name);

      if (rankings.length === 0) {
        rankingsDiv.innerHTML = '<p>No rankings available.</p>';
        return;
      }

      rankings.forEach((player, index) => {
        const playerDiv = document.createElement('div');
        playerDiv.className = `ranking-player ${index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : ''}`;

        playerDiv.onmouseenter = (e) => showHoverCard(player.name, e);
        playerDiv.onmouseleave = hideHoverCard;

        const medalIcon = index === 0 ? '<span class="goat">🐐</span>' :
                          index === 1 ? '<span class="medal second">🥈</span>' :
                          index === 2 ? '<span class="medal third">🥉</span>' : '';
        const appearances = player.wins + player.losses;
        const winRate = appearances > 0 ? ((player.wins / appearances) * 100).toFixed(0) + '%' : '—';

        playerDiv.innerHTML = `
          <div class="player-ranking">
            <div class="player-info">
              <h3><span class="rank-number">${index + 1}.</span> ${medalIcon}${player.name}</h3>
              <p>ELO: ${player.elo.toFixed(0)}</p>
            </div>
            <div class="player-stats-summary">
              <span>${player.wins}W / ${player.losses}L</span>
              <span>${winRate} win rate</span>
            </div>
          </div>
        `;
        rankingsDiv.appendChild(playerDiv);
      });
    })
    .catch(error => console.error('Error fetching rankings:', error));
}

// Hover Popup Logic
function showHoverCard(playerName, event) {
  const player = players.find(p => p.name === playerName);
  if (!player) return;

  const hoverContainer = document.getElementById('hover-card-container');
  hoverContainer.innerHTML = `
    <div class="player-card" style="margin:0; box-shadow: var(--shadow-lg);">
      <div class="card-content">
        <img src="${player.headshot}" alt="${player.name}" class="headshot" style="width:120px; height:auto;">
        <h2 style="font-size:14px;">${player.name}</h2>
        ${buildAwardsHtml(player.name)}
        <div class="card-stats">
            <p><strong>PPG:</strong> ${player.avg_ppg.toFixed(1)}</p>
            <p><strong>APG:</strong> ${player.avg_apg.toFixed(1)}</p>
            <p><strong>RPG:</strong> ${player.avg_rpg.toFixed(1)}</p>
        </div>
      </div>
    </div>
  `;

  hoverContainer.style.display = 'block';
  hoverContainer.style.top = (event.pageY + 10) + 'px';
  hoverContainer.style.left = (event.pageX + 20) + 'px';
}

function hideHoverCard() {
  document.getElementById('hover-card-container').style.display = 'none';
}

function toggleGameMode() {
  winnerStays = !winnerStays;
  winner = null;
  const toggleButton = document.getElementById('toggle-game-mode');
  toggleButton.innerText = winnerStays ? 'Disable Winner Stays' : 'Enable Winner Stays';
  
  // STEP 3: Make the button turn black when clicked
  toggleButton.classList.toggle('active', winnerStays);
}

function filterRankings() {
  const searchQuery = document.getElementById('search-bar').value.toLowerCase();
  const rankingsDiv = document.getElementById('rankings-list');
  const rankingPlayers = rankingsDiv.querySelectorAll('.ranking-player');

  rankingPlayers.forEach((player) => {
    const playerName = player.querySelector('h3').textContent.toLowerCase();
    player.style.display = playerName.includes(searchQuery) ? 'flex' : 'none';
  });
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.getElementById(tabName).classList.add('active');
  document.querySelectorAll('nav a').forEach(link => link.classList.remove('active'));
  const activeLink = document.querySelector(`a[onclick="switchTab('${tabName}')"]`);
  if (activeLink) activeLink.classList.add('active');
}