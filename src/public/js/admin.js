// Store admin's club data
let currentClub = null;

// Initialize the dashboard
async function initializeDashboard() {
    const email = localStorage.getItem('adminEmail');
    if (!email) {
        window.location.href = '/';
        return;
    }

    try {
        const response = await fetch('/api/admin/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();
        if (response.ok) {
            currentClub = data.club;
            updateClubInfo();
            loadContent('manage-events');
        } else {
            alert('Session expired. Please login again.');
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error loading dashboard');
    }
}

// Update club info in header
function updateClubInfo() {
    const clubInfo = document.getElementById('clubInfo');
    clubInfo.innerHTML = `
        <strong>${currentClub.name}</strong> | 
        President: ${currentClub.president.name} | 
        Members: ${currentClub.members.length}
    `;
}

// Load different content sections
async function loadContent(section) {
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = '<div class="loading">Loading...</div>';

    switch(section) {
        case 'create-event':
            showCreateEventForm();
            break;
        case 'manage-events':
            await loadEvents();
            break;
        case 'add-member':
            showAddMemberForm();
            break;
        case 'members':
            await loadMembers();
            break;
        case 'messages':
            await loadMessages();
            break;
    }
}

// Show create event form
function showCreateEventForm() {
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = `
        <div class="content-card">
            <h2>Create New Event</h2>
            <form id="createEventForm" onsubmit="handleCreateEvent(event)">
                <div class="form-group">
                    <label for="title">Event Title</label>
                    <input type="text" id="title" name="title" required>
                </div>
                <div class="form-group">
                    <label for="description">Description</label>
                    <textarea id="description" name="description" rows="4" required></textarea>
                </div>
                <div class="form-group">
                    <label for="venue">Venue</label>
                    <input type="text" id="venue" name="venue" required>
                </div>
                <div class="form-group">
                    <label for="theme">Theme</label>
                    <input type="text" id="theme" name="theme">
                </div>
                <div class="form-group">
                    <label for="fees">Fees (₹)</label>
                    <input type="number" id="fees" name="fees" min="0" value="0">
                </div>
                <div class="form-group">
                    <label for="date">Date</label>
                    <input type="datetime-local" id="date" name="date" required>
                </div>
                <div class="form-group">
                    <label for="photo">Event Photo URL</label>
                    <input type="url" id="photo" name="photo" placeholder="https://...">
                </div>
                <button type="submit" class="btn btn-primary">Create Event</button>
            </form>
        </div>
    `;
}

// Handle create event form submission
async function handleCreateEvent(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    try {
        const response = await fetch('/api/admin/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: formData.get('title'),
                description: formData.get('description'),
                venue: formData.get('venue'),
                theme: formData.get('theme'),
                fees: Number(formData.get('fees')),
                date: formData.get('date'),
                photo: formData.get('photo'),
                clubId: currentClub._id
            })
        });

        const data = await response.json();
        if (response.ok) {
            alert('Event created successfully!');
            loadContent('manage-events');
        } else {
            alert(data.message || 'Error creating event');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error creating event');
    }
}

// Load and display all events
async function loadEvents() {
    try {
        const response = await fetch(`/api/admin/events/${currentClub._id}`);
        const data = await response.json();
        const events = data.events;

        const contentArea = document.getElementById('content-area');
        contentArea.innerHTML = `
            <div class="content-card">
                <h2>Manage Events</h2>
                <div class="event-list">
                    ${events.map(event => `
                        <div class="event-card">
                            <div class="event-header">
                                <h3>${event.title}</h3>
                                <div class="event-actions">
                                    <button onclick="editEvent('${event._id}')" class="btn btn-primary">Edit</button>
                                    <button onclick="deleteEvent('${event._id}')" class="btn btn-danger">Delete</button>
                                    <button onclick="viewParticipants('${event._id}')" class="btn btn-success">Participants</button>
                                </div>
                            </div>
                            <p><strong>Date:</strong> ${new Date(event.date).toLocaleString()}</p>
                            <p><strong>Venue:</strong> ${event.venue}</p>
                            <p><strong>Theme:</strong> ${event.theme || 'N/A'}</p>
                            <p><strong>Fees:</strong> ₹${event.fees || 'Free'}</p>
                            <p><strong>Status:</strong> ${event.status}</p>
                            <p>${event.description}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error:', error);
        showError('Error loading events');
    }
}

// Show add member form
function showAddMemberForm() {
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = `
        <div class="content-card">
            <h2>Add New Member</h2>
            <form id="addMemberForm" onsubmit="handleAddMember(event)">
                <div class="form-group">
                    <label for="name">Full Name</label>
                    <input type="text" id="name" name="name" required>
                </div>
                <div class="form-group">
                    <label for="email">University Email</label>
                    <input type="email" id="email" name="email" required 
                           pattern=".*@universalai\.edu\.in$"
                           title="Please use university email (@universalai.edu.in)">
                </div>
                <div class="form-group">
                    <label for="bio">Bio</label>
                    <textarea id="bio" name="bio" rows="3"></textarea>
                </div>
                <button type="submit" class="btn btn-primary">Add Member</button>
            </form>
        </div>
    `;
}

// Handle add member form submission
async function handleAddMember(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    try {
        const response = await fetch('/api/admin/students', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: formData.get('name'),
                email: formData.get('email'),
                bio: formData.get('bio'),
                clubId: currentClub._id
            })
        });

        const data = await response.json();
        if (response.ok) {
            alert('Member added successfully!');
            loadContent('members');
        } else {
            alert(data.message || 'Error adding member');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error adding member');
    }
}

// Load and display club members
async function loadMembers() {
    try {
        const response = await fetch(`/api/admin/students/${currentClub._id}`);
        const data = await response.json();
        const members = data.members;

        const contentArea = document.getElementById('content-area');
        contentArea.innerHTML = `
            <div class="content-card">
                <h2>Club Members</h2>
                <div class="member-list">
                    ${members.map(member => `
                        <div class="member-card">
                            <h3>${member.name}</h3>
                            <p><strong>Email:</strong> ${member.email}</p>
                            <p><strong>Bio:</strong> ${member.bio || 'No bio provided'}</p>
                            <p><strong>Joined:</strong> ${new Date(member.createdAt).toLocaleDateString()}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error:', error);
        showError('Error loading members');
    }
}

// Load and display messages
async function loadMessages() {
    try {
        const response = await fetch(`/api/admin/messages/${currentClub._id}`);
        const data = await response.json();
        const messages = data.messages;

        const contentArea = document.getElementById('content-area');
        contentArea.innerHTML = `
            <div class="content-card">
                <h2>Messages from Super Admin</h2>
                <div class="messages-list">
                    ${messages.map(message => `
                        <div class="message-card">
                            <div class="message-header">
                                <span>Received: ${new Date(message.createdAt).toLocaleString()}</span>
                            </div>
                            <h3>${message.title}</h3>
                            <p>${message.content}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error:', error);
        showError('Error loading messages');
    }
}

// Edit event
async function editEvent(eventId) {
    try {
        const response = await fetch(`/api/admin/events/${eventId}`);
        const data = await response.json();
        const event = data.event;

        const contentArea = document.getElementById('content-area');
        contentArea.innerHTML = `
            <div class="content-card">
                <h2>Edit Event</h2>
                <form onsubmit="handleUpdateEvent('${eventId}', event)">
                    <div class="form-group">
                        <label for="title">Event Title</label>
                        <input type="text" id="title" name="title" value="${event.title}" required>
                    </div>
                    <div class="form-group">
                        <label for="description">Description</label>
                        <textarea id="description" name="description" rows="4" required>${event.description}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="venue">Venue</label>
                        <input type="text" id="venue" name="venue" value="${event.venue}" required>
                    </div>
                    <div class="form-group">
                        <label for="theme">Theme</label>
                        <input type="text" id="theme" name="theme" value="${event.theme || ''}">
                    </div>
                    <div class="form-group">
                        <label for="fees">Fees (₹)</label>
                        <input type="number" id="fees" name="fees" min="0" value="${event.fees || 0}">
                    </div>
                    <div class="form-group">
                        <label for="date">Date</label>
                        <input type="datetime-local" id="date" name="date" value="${event.date.slice(0, 16)}" required>
                    </div>
                    <div class="form-group">
                        <label for="status">Status</label>
                        <select id="status" name="status">
                            <option value="upcoming" ${event.status === 'upcoming' ? 'selected' : ''}>Upcoming</option>
                            <option value="ongoing" ${event.status === 'ongoing' ? 'selected' : ''}>Ongoing</option>
                            <option value="completed" ${event.status === 'completed' ? 'selected' : ''}>Completed</option>
                            <option value="cancelled" ${event.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary">Update Event</button>
                </form>
            </div>
        `;
    } catch (error) {
        console.error('Error:', error);
        showError('Error loading event details');
    }
}

// Handle update event
async function handleUpdateEvent(eventId, event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    try {
        const response = await fetch(`/api/admin/events/${eventId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: formData.get('title'),
                description: formData.get('description'),
                venue: formData.get('venue'),
                theme: formData.get('theme'),
                fees: Number(formData.get('fees')),
                date: formData.get('date'),
                status: formData.get('status')
            })
        });

        if (response.ok) {
            alert('Event updated successfully!');
            loadContent('manage-events');
        } else {
            const data = await response.json();
            alert(data.message || 'Error updating event');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error updating event');
    }
}

// Delete event
async function deleteEvent(eventId) {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
        const response = await fetch(`/api/admin/events/${eventId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('Event deleted successfully!');
            loadContent('manage-events');
        } else {
            const data = await response.json();
            alert(data.message || 'Error deleting event');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error deleting event');
    }
}

// View event participants
async function viewParticipants(eventId) {
    try {
        const response = await fetch(`/api/admin/events/${eventId}/participants`);
        const data = await response.json();
        const participants = data.participants;

        const contentArea = document.getElementById('content-area');
        contentArea.innerHTML = `
            <div class="content-card">
                <h2>Event Participants</h2>
                <div class="member-list">
                    ${participants.map(participant => `
                        <div class="member-card">
                            <h3>${participant.student.name}</h3>
                            <p><strong>Email:</strong> ${participant.student.email}</p>
                            <p><strong>Phone:</strong> ${participant.phone}</p>
                            <p><strong>Registered:</strong> ${new Date(participant.registeredAt).toLocaleString()}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error:', error);
        showError('Error loading participants');
    }
}

// Helper function to show errors
function showError(message) {
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = `
        <div class="error-message">
            <p>${message}</p>
            <button onclick="loadContent('manage-events')" class="btn btn-primary">Try Again</button>
        </div>
    `;
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', initializeDashboard); 