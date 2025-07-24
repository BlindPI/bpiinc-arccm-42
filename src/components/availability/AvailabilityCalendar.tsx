import React, { useState } from 'react';
import { useAvailabilityByUser } from '@/hooks/useUserAvailability';
import { UserAvailabilitySlot, AvailabilityUser, DAYS_OF_WEEK } from '@/types/availability';

const AvailabilityCalendar: React.FC = () => {
  const { availabilityByUser, isLoading, error } = useAvailabilityByUser();
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const getAvailableUsers = (dayOfWeek: number, date: Date): UserAvailabilitySlot[] => {
    const allSlots: UserAvailabilitySlot[] = [];
    availabilityByUser.forEach(user => {
      user.availability_slots.forEach(slot => allSlots.push(slot));
    });

    return allSlots.filter(availability => {
      if (availability.day_of_week !== dayOfWeek) return false;
      if (selectedUser && availability.user_id !== selectedUser) return false;

      const effectiveDate = new Date(availability.effective_date);
      const expiryDate = availability.expiry_date ? new Date(availability.expiry_date) : null;

      if (date < effectiveDate) return false;
      if (expiryDate && date > expiryDate) return false;

      return true;
    });
  };

  const generateCalendar = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Add headers
    dayHeaders.forEach(day => {
      days.push(
        <div key={day} className="day-header">
          {day}
        </div>
      );
    });

    // Add calendar days
    let currentDay = new Date(startDate);
    for (let week = 0; week < 6; week++) {
      for (let day = 0; day < 7; day++) {
        const isCurrentMonth = currentDay.getMonth() === month - 1;
        const isToday = currentDay.toDateString() === new Date().toDateString();
        const dayOfWeek = currentDay.getDay();
        const availableUsers = getAvailableUsers(dayOfWeek, currentDay);
        const hasAvailability = availableUsers.length > 0;

        days.push(
          <div
            key={currentDay.toISOString()}
            className={`day ${isToday ? 'today' : ''} ${hasAvailability ? 'has-availability' : ''} ${!isCurrentMonth ? 'other-month' : ''}`}
            onClick={() => isCurrentMonth && handleDayClick(new Date(currentDay), availableUsers)}
          >
            {isCurrentMonth && (
              <>
                <span className="day-number">{currentDay.getDate()}</span>
                {hasAvailability && (
                  <span className="availability-count">{availableUsers.length}</span>
                )}
              </>
            )}
          </div>
        );

        currentDay.setDate(currentDay.getDate() + 1);
      }
    }

    return days;
  };

  const handleDayClick = (date: Date, availableUsers: UserAvailabilitySlot[]) => {
    setSelectedDate(date);
    setModalOpen(true);
  };

  const getSelectedDateAvailability = (): UserAvailabilitySlot[] => {
    if (!selectedDate) return [];
    const dayOfWeek = selectedDate.getDay();
    return getAvailableUsers(dayOfWeek, selectedDate);
  };

  if (isLoading) {
    return <div className="loading">Loading availability data...</div>;
  }

  if (error) {
    return <div className="error">{error.message || 'An error occurred'}</div>;
  }

  return (
    <div className="availability-calendar">
      <div className="calendar-header">
        <h2>User Availability Calendar</h2>
        <div className="controls">
          <select 
            value={selectedUser} 
            onChange={(e) => setSelectedUser(e.target.value)}
            className="user-filter"
          >
            <option value="">All Users</option>
            {availabilityByUser.map(user => (
              <option key={user.user_id} value={user.user_id}>
                {user.display_name}
              </option>
            ))}
          </select>
          <input
            type="month"
            value={currentMonth}
            onChange={(e) => setCurrentMonth(e.target.value)}
            className="month-selector"
          />
          <button onClick={() => window.location.reload()} className="refresh-btn">
            Refresh
          </button>
        </div>
      </div>

      <div className="calendar-grid">
        {generateCalendar()}
      </div>

      {selectedUser && (
        <div className="user-summary">
          <h3>{availabilityByUser.find(u => u.user_id === selectedUser)?.display_name} Schedule</h3>
          {availabilityByUser
            .find(u => u.user_id === selectedUser)
            ?.availability_slots.map(availability => {
              const dayName = DAYS_OF_WEEK.find(d => d.value === availability.day_of_week)?.label || 'Unknown';
              return (
                <div key={availability.id} className="schedule-item">
                  <strong>{dayName}</strong>: {availability.start_time} - {availability.end_time}
                </div>
              );
            })}
        </div>
      )}

      {modalOpen && selectedDate && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Available Users - {selectedDate.toDateString()}</h3>
              <button onClick={() => setModalOpen(false)}>×</button>
            </div>
            <div className="modal-content">
              {getSelectedDateAvailability().length === 0 ? (
                <p>No users available on this day.</p>
              ) : (
                getSelectedDateAvailability().map(availability => {
                  const user = availabilityByUser.find(u => u.user_id === availability.user_id);
                  return (
                    <div key={availability.id} className="availability-item">
                      <strong>{user?.display_name || availability.user_id}</strong>
                      <div>Time: {availability.start_time} - {availability.end_time}</div>
                      <div>Type: {availability.availability_type}</div>
                      <div>Duration: {availability.time_slot_duration} min</div>
                      {availability.notes && <div>Notes: {availability.notes}</div>}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .availability-calendar {
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
        }

        .calendar-header {
          margin-bottom: 20px;
        }

        .controls {
          display: flex;
          gap: 10px;
          align-items: center;
          margin-top: 10px;
        }

        .user-filter, .month-selector {
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }

        .refresh-btn {
          padding: 8px 16px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .refresh-btn:hover {
          background: #0056b3;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 1px;
          border: 1px solid #ccc;
          border-radius: 8px;
          overflow: hidden;
        }

        .day-header {
          background: #333;
          color: white;
          padding: 10px;
          text-align: center;
          font-weight: bold;
        }

        .day {
          min-height: 80px;
          padding: 5px;
          border: 1px solid #eee;
          cursor: pointer;
          position: relative;
          background: white;
        }

        .day:hover {
          background: #f5f5f5;
        }

        .day.today {
          background: #ffffcc;
        }

        .day.has-availability {
          background: #e8f5e8;
        }

        .day.other-month {
          background: #f9f9f9;
          cursor: default;
        }

        .day-number {
          font-weight: bold;
        }

        .availability-count {
          position: absolute;
          top: 2px;
          right: 2px;
          background: #007bff;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
        }

        .user-summary {
          margin-top: 20px;
          padding: 15px;
          background: #f9f9f9;
          border-radius: 8px;
        }

        .schedule-item {
          padding: 5px 0;
          border-bottom: 1px solid #eee;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal {
          background: white;
          border-radius: 8px;
          max-width: 500px;
          max-height: 400px;
          overflow-y: auto;
          margin: 20px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #eee;
        }

        .modal-header button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
        }

        .modal-content {
          padding: 20px;
        }

        .availability-item {
          padding: 10px;
          border: 1px solid #ddd;
          margin: 10px 0;
          border-radius: 4px;
          background: #f9f9f9;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        .error {
          background: #ffe6e6;
          border: 1px solid #ff0000;
          color: #cc0000;
          padding: 15px;
          border-radius: 4px;
          margin: 20px 0;
        }
      `}</style>
    </div>
  );
};

export default AvailabilityCalendar;