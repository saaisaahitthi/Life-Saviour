const TimelineEvent = require('../models/TimelineEvent');
const { getIo } = require('../socket');

const createEvent = async (emergencyId, type, title, description, actor = null, metadata = null) => {
  try {
    const event = new TimelineEvent({
      emergencyId,
      type,
      title,
      description,
      actor,
      metadata
    });

    await event.save();

    const io = getIo();
    if (io) {
      io.to(emergencyId.toString()).emit('new_timeline_event', event);
    }

    return event;
  } catch (error) {
    console.error('Error creating timeline event:', error);
    throw error;
  }
};

const getEventsByEmergency = async (emergencyId) => {
  try {
    const events = await TimelineEvent.find({ emergencyId }).sort({ createdAt: -1 });
    return events;
  } catch (error) {
    console.error('Error fetching timeline events:', error);
    throw error;
  }
};

module.exports = {
  createEvent,
  getEventsByEmergency
};
