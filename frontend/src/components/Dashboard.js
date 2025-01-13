import React, { useState, useEffect } from 'react';
import { Link, useHistory } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';

function Dashboard() {
  const [events, setEvents] = useState([]);
  const history = useHistory();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      history.push('/');
      return;
    }

    const fetchEvents = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/events', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEvents(response.data);
      } catch (error) {
        console.error('Failed to fetch events:', error);
      }
    };

    fetchEvents();

    const socket = io('http://localhost:5000');
    socket.on('attendeeUpdate', ({ eventId, attendees }) => {
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event._id === eventId ? { ...event, attendees } : event
        )
      );
    });

    return () => socket.disconnect();
  }, [history]);

  const handleAttend = async (eventId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.post(`http://localhost:5000/api/events/${eventId}/attend`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Failed to attend event:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    history.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-semibold">Event Management</h1>
              </div>
            </div>
            <div className="flex items-center">
              <Link to="/create-event" className="mr-4 px-3 py-2 rounded-md text-sm font-medium text-indigo-600 hover:text-indigo-500">Create Event</Link>
              <button onClick={handleLogout} className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-500">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Upcoming Events</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map(event => (
              <div key={event._id} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">{event.name}</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">{event.description}</p>
                  <p className="mt-2 text-sm text-gray-500">Date: {new Date(event.date).toLocaleDateString()}</p>
                  <p className="mt-2 text-sm text-gray-500">Attendees: {event.attendees}</p>
                  <button
                    onClick={() => handleAttend(event._id)}
                    className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Attend
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

