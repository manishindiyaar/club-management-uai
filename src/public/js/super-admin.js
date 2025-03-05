// Super Admin API endpoints
const API = {
    STATS: '/api/super-admin/stats',
    CLUBS: '/api/super-admin/clubs',
    MESSAGES: '/api/super-admin/messages',
    VERIFY: '/api/super-admin/verify'
};

// Store super admin data
let currentSuperAdmin = null;
let clubs = [];

// Initialize the dashboard
async function initializeDashboard() {
    const email = localStorage.getItem('superAdminEmail');
    if (!email) {
        window.location.href = '/super-admin-login';
        return;
    }

    try {
        const response = await fetch(API.VERIFY, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();
        if (response.ok) {
            currentSuperAdmin = data.superAdmin;
            await loadDashboard();
        } else {
            alert('Session expired. Please login again.');
            window.location.href = '/super-admin-login';
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error initializing dashboard');
    }
}

// Load dashboard data
async function loadDashboard() {
    try {
        const [statsResponse, clubsResponse] = await Promise.all([
            fetch(API.STATS),
            fetch(API.CLUBS)
        ]);

        const stats = await statsResponse.json();
        const clubsData = await clubsResponse.json();

        updateStats(stats);
        clubs = clubsData.clubs;
        updateClubList();
        updateClubSelect();
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showError('Error loading dashboard data');
    }
}

// Update dashboard statistics
function updateStats(stats) {
    document.getElementById('totalClubs').textContent = stats.totalClubs;
    document.getElementById('totalStudents').textContent = stats.totalStudents;
    document.getElementById('activeEvents').textContent = stats.activeEvents;
}

// Update club list display
function updateClubList() {
    const clubList = document.getElementById('clubList');
    clubList.innerHTML = clubs.map(club => `
        <div class="club-card">
            <h4>${club.name}</h4>
            <p>${club.description}</p>
            <div class="club-stats">
                <span>${club.members.length} Members</span>
                <span>${club.events.length} Events</span>
            </div>
            <div class="club-actions">
                <button onclick="viewClubDetails('${club._id}')" class="btn btn-primary">View Details</button>
                <button onclick="deleteClub('${club._id}')" class="btn btn-danger">Delete Club</button>
            </div>
        </div>
    `).join('');
}

// Update club select dropdown
function updateClubSelect() {
    const select = document.getElementById('clubSelect');
    select.innerHTML = `
        <option value="">Select a club</option>
        <option value="all">All Clubs</option>
        ${clubs.map(club => `
            <option value="${club._id}">${club.name}</option>
        `).join('')}
    `;
}

// Handle club creation
async function handleCreateClub(event) {
    event.preventDefault();
    const formData = {
        name: document.getElementById('clubName').value,
        description: document.getElementById('clubDescription').value,
        presidentEmail: document.getElementById('presidentEmail').value,
        vicePresidentEmail: document.getElementById('vicePresidentEmail').value
    };

    try {
        const response = await fetch(API.CLUBS, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        if (response.ok) {
            alert('Club created successfully!');
            hideModal('createClubModal');
            document.getElementById('createClubForm').reset();
            await loadDashboard();
        } else {
            alert(data.message || 'Error creating club');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error creating club');
    }
}

// View club details
async function viewClubDetails(clubId) {
    try {
        const response = await fetch(`${API.CLUBS}/${clubId}`);
        const data = await response.json();
        const club = data.club;

        showModal('clubDetailsModal');
        document.getElementById('clubDetailsContent').innerHTML = `
            <h3>${club.name}</h3>
            <p><strong>Description:</strong> ${club.description}</p>
            <p><strong>President:</strong> ${club.president.name} (${club.president.email})</p>
            <p><strong>Vice President:</strong> ${club.vicePresident.name} (${club.vicePresident.email})</p>
            <div class="club-stats">
                <div>
                    <h4>Members (${club.members.length})</h4>
                    <ul>
                        ${club.members.map(member => `
                            <li>${member.name} (${member.email})</li>
                        `).join('')}
                    </ul>
                </div>
                <div>
                    <h4>Events (${club.events.length})</h4>
                    <ul>
                        ${club.events.map(event => `
                            <li>
                                ${event.title} - ${new Date(event.date).toLocaleDateString()}
                                (${event.status})
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error:', error);
        alert('Error loading club details');
    }
}

// Delete club
async function deleteClub(clubId) {
    if (!confirm('Are you sure you want to delete this club? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`${API.CLUBS}/${clubId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('Club deleted successfully!');
            await loadDashboard();
        } else {
            const data = await response.json();
            alert(data.message || 'Error deleting club');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error deleting club');
    }
}

// Handle sending messages
async function handleSendMessage(event) {
    event.preventDefault();
    const formData = {
        clubId: document.getElementById('clubSelect').value,
        title: document.getElementById('messageTitle').value,
        content: document.getElementById('messageContent').value
    };

    try {
        const response = await fetch(API.MESSAGES, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        if (response.ok) {
            alert('Message sent successfully!');
            event.target.reset();
        } else {
            alert(data.message || 'Error sending message');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error sending message');
    }
}

// Modal functions
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function hideModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Error display
function showError(message) {
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = `
        <div class="error-message">
            <p>${message}</p>
            <button onclick="loadDashboard()" class="btn btn-primary">Try Again</button>
        </div>
    `;
}

// Logout function
function logout() {
    localStorage.removeItem('superAdminEmail');
    window.location.href = '/super-admin-login';
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', initializeDashboard); 