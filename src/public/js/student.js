// Store student data after login
let currentStudent = null;

// Initialize the dashboard
async function initializeDashboard() {
    const email = localStorage.getItem('studentEmail');
    if (!email) {
        window.location.href = '/';
        return;
    }

    try {
        const response = await fetch('/api/students/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();
        if (response.ok) {
            currentStudent = data.student;
            loadContent('events');
        } else {
            alert('Session expired. Please login again.');
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error loading dashboard');
    }
}

// Load different content sections
async function loadContent(section) {
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = '<div class="loading">Loading...</div>';

    switch(section) {
        case 'events':
            await loadEvents();
            break;
        case 'my-club':
            await loadMyClub();
            break;
        case 'clubs':
            await loadAllClubs();
            break;
    }
}

// Load and display all upcoming events
async function loadEvents() {
    try {
        const response = await fetch('/api/students/events');
        const data = await response.json();
        const events = data.events;

        const contentArea = document.getElementById('content-area');
        contentArea.innerHTML = `
            <div class="content-card">
                <h2>Upcoming Events</h2>
                <div class="event-list">
                    ${events.length ? events.map(event => `
                        <div class="event-card">
                            ${event.photo ? `<img src="${event.photo}" alt="${event.title}" class="event-image">` : ''}
                            <div class="event-details">
                                <h3>${event.title}</h3>
                                <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
                                <p><strong>Venue:</strong> ${event.venue}</p>
                                <p><strong>Theme:</strong> ${event.theme || 'N/A'}</p>
                                <p><strong>Fees:</strong> ₹${event.fees || 'Free'}</p>
                                <p>${event.description}</p>
                                <button onclick="joinEvent('${event._id}')" class="join-btn">Join Event</button>
                            </div>
                        </div>
                    `).join('') : '<p>No upcoming events available.</p>'}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error:', error);
        showError('Error loading events');
    }
}

// Load and display student's club details
async function loadMyClub() {
    if (!currentStudent) return;

    try {
        const response = await fetch(`/api/students/club/${currentStudent._id}`);
        const data = await response.json();

        const contentArea = document.getElementById('content-area');
        if (response.ok && data.club) {
            contentArea.innerHTML = `
                <div class="content-card">
                    <h2>My Club: ${data.club.name}</h2>
                    <div class="club-details">
                        <p><strong>Description:</strong> ${data.club.description}</p>
                        <div class="club-leaders">
                            <h3>Club Leaders</h3>
                            <p><strong>President:</strong> ${data.club.president.name}</p>
                            <p><strong>Vice President:</strong> ${data.club.vicePresident.name}</p>
                        </div>
                        <p><strong>Total Members:</strong> ${data.club.members.length}</p>
                    </div>
                </div>
            `;
        } else {
            contentArea.innerHTML = `
                <div class="content-card">
                    <h2>My Club</h2>
                    <p>You are not a member of any club yet.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error loading club details');
    }
}

// Load and display all clubs
async function loadAllClubs() {
    try {
        const response = await fetch('/api/students/clubs');
        const data = await response.json();
        const clubs = data.clubs;

        const contentArea = document.getElementById('content-area');
        contentArea.innerHTML = `
            <div class="content-card">
                <h2>All Clubs</h2>
                <div class="club-list">
                    ${clubs.map(club => `
                        <div class="club-card">
                            <div class="club-details">
                                <h3>${club.name}</h3>
                                <p>${club.description}</p>
                                <p><strong>President:</strong> ${club.president.name}</p>
                                <p><strong>Vice President:</strong> ${club.vicePresident.name}</p>
                                <p><strong>Members:</strong> ${club.members.length}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error:', error);
        showError('Error loading clubs');
    }
}

// Join an event
async function joinEvent(eventId) {
    if (!currentStudent) {
        alert('Please login first');
        return;
    }

    const phone = prompt('Please enter your phone number to join the event:');
    if (!phone) return;

    try {
        const response = await fetch(`/api/students/events/join/${eventId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                studentId: currentStudent._id,
                phone
            })
        });

        const data = await response.json();
        if (response.ok) {
            alert('Successfully joined the event!');
            loadEvents(); // Refresh events list
        } else {
            alert(data.message || 'Error joining event');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error joining event');
    }
}

// Helper function to show errors
function showError(message) {
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = `
        <div class="error-message">
            <p>${message}</p>
            <button onclick="loadContent('events')">Try Again</button>
        </div>
    `;
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', initializeDashboard); 