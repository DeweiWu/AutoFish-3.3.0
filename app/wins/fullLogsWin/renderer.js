const { ipcRenderer } = require('electron');

function formatTime(ms) {
    let totalSeconds = Math.floor(ms / 1000);
    let hours = Math.floor(totalSeconds / 3600);
    let minutes = Math.floor((totalSeconds % 3600) / 60);
    let seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function createLogTable(logs) {
    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Place (profile)</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Missed</th>
                    <th>Caught</th>
                </tr>
            </thead>
            <tbody>
    `;

    logs.forEach(log => {
        tableHTML += `
            <tr>
                <td>${log.place}</td>
                <td>${log.date}</td>
                <td>${formatTime(log.time)}</td>
                <td class="missed">${log.missed}</td>
                <td class="caught">${log.caught}</td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table>`;
    return tableHTML;
}

const render = async () => {
  const logs = await ipcRenderer.invoke('get-logs');
  let container = document.createElement('div');
  container.className = 'container';
  container.innerHTML = createLogTable(logs);
  document.body.append(container);
  const clearLogsButton = document.createElement('input');
  clearLogsButton.type = 'button';
  clearLogsButton.className = 'clearLogs';
  clearLogsButton.value = 'Clear Sessions';
  container.append(clearLogsButton);
  clearLogsButton.addEventListener('click', () => {
    ipcRenderer.invoke('clear-logs').then(() => {
      document.body.innerHTML = ``;
      render();
    })
  })
}

render();
