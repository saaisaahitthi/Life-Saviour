const Emergency = require('../models/Emergency');
const User = require('../models/User');
const AIChat = require('../models/AIChat');
const aiService = require('../services/aiService');
const aiChatService = require('../services/aiChatService');
const notificationService = require('../services/notificationService');
const dispatchService = require('../services/dispatchService');
const hospitalService = require('../services/hospitalService');
const timelineService = require('../services/timelineService');
const { TIMELINE_EVENT_TYPES, TIMELINE_TITLES } = require('../constants/timelineConstants');

exports.createEmergency = async (req, res) => {
  try {
    const { 
      patientName, age, gender, bloodGroup, location, coordinates, 
      severity, symptoms, additionalNotes, transportType,
      triageInputs, wearableSnapshot 
    } = req.body;

    // AI Analysis (with smart fallback if API is unavailable)
    let aiTriage;
    try {
      aiTriage = await aiService.analyzeEmergency({
        symptoms, age, notes: additionalNotes, ...triageInputs
      });
    } catch (aiErr) {
      console.warn('⚠️ AI triage unavailable, using smart fallback:', aiErr.message);
      // Smart fallback based on keywords and triage inputs
      const lowerSymptoms = (symptoms || '').toLowerCase();
      const isCardiac = lowerSymptoms.includes('chest') || lowerSymptoms.includes('heart');
      const isNeuro = lowerSymptoms.includes('head') || lowerSymptoms.includes('stroke') || lowerSymptoms.includes('seizure');
      const isRespiratory = lowerSymptoms.includes('breath') || lowerSymptoms.includes('asthma') || lowerSymptoms.includes('lung');
      const isTrauma = lowerSymptoms.includes('injury') || lowerSymptoms.includes('wound') || lowerSymptoms.includes('bleeding') || lowerSymptoms.includes('fracture');
      const painScore = triageInputs?.painLevel || 5;
      const breathScore = triageInputs?.breathingDifficulty || 5;
      const consciousness = triageInputs?.consciousnessState || 'conscious';
      
      const isCritical = severity === 'critical' || painScore >= 8 || breathScore >= 8 || consciousness === 'unconscious' || isCardiac;
      const isHigh = severity === 'medium' || painScore >= 6 || isNeuro || isRespiratory;

      aiTriage = {
        category: isCardiac ? 'cardiac' : isNeuro ? 'neurological' : isRespiratory ? 'respiratory' : isTrauma ? 'trauma' : 'general',
        severityScore: isCritical ? 9 : isHigh ? 6 : 4,
        priorityLevel: isCritical ? 'critical' : isHigh ? 'high' : 'medium',
        recommendedDepartment: isCardiac ? 'Cardiology' : isNeuro ? 'Neurology' : isRespiratory ? 'Pulmonology' : isTrauma ? 'Trauma' : 'Emergency',
        analysisSummary: `Patient presents with ${symptoms}. Initial triage based on reported severity (${severity}) and pain level (${painScore}/10). AI-enhanced analysis will be available when service is restored.`
      };
    }

    const emergency = await Emergency.create({
      patientId: req.user._id,
      patientName,
      age,
      gender,
      bloodGroup,
      location,
      coordinates,
      severity,
      symptoms,
      additionalNotes,
      transportType,
      triageInputs,
      aiTriage,
      ...(wearableSnapshot ? { wearableSnapshot } : {})
    });

    // Auto-allocate Hospital
    const recommendedHospital = await hospitalService.allocateHospital(emergency);
    if (recommendedHospital) {
      emergency.assignedHospital = recommendedHospital._id;
      await emergency.save();

      // Decrement Hospital Capacity
      if (recommendedHospital.capacity.emergencyBeds.available > 0) {
        recommendedHospital.capacity.emergencyBeds.available -= 1;
      }
      if (severity === 'critical' && recommendedHospital.capacity.icuBeds.available > 0) {
        recommendedHospital.capacity.icuBeds.available -= 1;
      }

      // Automatically update status to 'full' if below 10% capacity
      const capacityRatio = recommendedHospital.capacity.emergencyBeds.available / (recommendedHospital.capacity.emergencyBeds.total || 1);
      if (capacityRatio <= 0.1) {
        recommendedHospital.status = 'full';
      }
      await recommendedHospital.save();
    }

    // Create Timeline Event
    await timelineService.createEvent(
      emergency._id,
      TIMELINE_EVENT_TYPES.STATUS_CHANGE,
      TIMELINE_TITLES.EMERGENCY_CREATED,
      `Emergency request initiated by ${patientName}. Severity: ${severity}.`,
      { name: patientName, role: 'patient' }
    );

    const populated = await Emergency.findById(emergency._id)
      .populate('patientId', 'name email phone')
      .populate('assignedHospital');

    // Emit to connected doctors in the assigned hospital room
    if (req.io) {
      if (populated.assignedHospital) {
        req.io.to(`hospital_${populated.assignedHospital.name}`).emit('new_emergency', populated);
      } else {
        req.io.emit('new_emergency', populated); // Fallback
      }

      // Create notifications for specialized active doctors
      const CATEGORY_TO_SPEC = {
        'cardiac': 'cardiology',
        'cardiovascular': 'cardiology',
        'trauma': 'trauma',
        'neurological': 'neurology',
        'respiratory': 'respiratory',
        'general': 'general',
        'orthopedic': 'orthopedics',
        'pediatric': 'pediatrics'
      };
      
      const targetSpec = CATEGORY_TO_SPEC[aiTriage.category] || 'general';

      const doctors = await User.find({ 
        role: 'doctor', 
        isOnline: true,
        specialization: { $in: [targetSpec, 'general'] }
      });

      for (const doctor of doctors) {
        // Strictly filter notifications by Hospital Affiliation!
        if (populated.assignedHospital && doctor.hospitalAffiliation) {
          if (populated.assignedHospital.name.toLowerCase() !== doctor.hospitalAffiliation.toLowerCase()) {
            continue; // Skip this doctor if they work at a different hospital
          }
        }

        await notificationService.createNotification(req.io, {
          recipient: doctor._id,
          title: '🚨 NEW EMERGENCY',
          message: `New ${aiTriage.category} emergency: ${symptoms}`,
          type: 'emergency_created',
          referenceId: emergency._id,
          referenceModel: 'Emergency',
          priority: aiTriage.priorityLevel
        });
      }

      // Auto-assign ambulance if applicable
      if (transportType === 'ambulance') {
        await dispatchService.assignNearestAmbulance(req.io, emergency._id);
      }
    }

    res.status(201).json(populated);
  } catch (error) {
    console.error('Failed to create emergency:', error);
    res.status(500).json({ message: 'Failed to create emergency', error: error.message });
  }
};

exports.getAllEmergencies = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.severity) filter.severity = req.query.severity;

    const emergencies = await Emergency.find(filter)
      .populate('patientId', 'name email phone')
      .populate('assignedDoctor', 'name email specialization')
      .populate('assignedDriver', 'name email vehicleNumber')
      .populate('assignedHospital')
      .sort({ createdAt: -1 });

    res.json(emergencies);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch emergencies', error: error.message });
  }
};

exports.getMyEmergencies = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;

    let filter = {};
    if (role === 'patient') filter.patientId = userId;
    else if (role === 'doctor') filter.assignedDoctor = userId;
    else if (role === 'driver') filter.assignedDriver = userId;

    const emergencies = await Emergency.find(filter)
      .populate('patientId', 'name email phone')
      .populate('assignedDoctor', 'name email specialization')
      .populate('assignedDriver', 'name email vehicleNumber')
      .populate('assignedHospital')
      .sort({ createdAt: -1 });

    res.json(emergencies);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch emergencies', error: error.message });
  }
};

exports.getEmergencyById = async (req, res) => {
  try {
    const emergency = await Emergency.findById(req.params.id)
      .populate('patientId', 'name email phone')
      .populate('assignedDoctor', 'name email specialization')
      .populate('assignedDriver', 'name email vehicleNumber')
      .populate('assignedHospital');

    if (!emergency) {
      return res.status(404).json({ message: 'Emergency not found' });
    }

    res.json(emergency);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch emergency', error: error.message });
  }
};

exports.updateEmergency = async (req, res) => {
  try {
    const updates = req.body;
    const emergency = await Emergency.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )
      .populate('patientId', 'name email phone')
      .populate('assignedDoctor', 'name email specialization')
      .populate('assignedDriver', 'name email vehicleNumber');

    if (!emergency) {
      return res.status(404).json({ message: 'Emergency not found' });
    }

    // Emit update to the specific emergency room
    if (req.io) {
      req.io.to(`emergency_${emergency._id}`).emit('emergency_updated', emergency);
    }

    res.json(emergency);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update emergency', error: error.message });
  }
};

exports.assignDoctor = async (req, res) => {
  try {
    const emergency = await Emergency.findById(req.params.id);
    
    if (!emergency) {
      return res.status(404).json({ message: 'Emergency not found' });
    }

    // Prevent duplicate assignment
    if (emergency.assignedDoctor) {
      return res.status(400).json({ message: 'Emergency already has an assigned doctor' });
    }

    // Specialization validation
    const CATEGORY_TO_SPEC = {
      'cardiac': 'cardiology', 'cardiovascular': 'cardiology',
      'trauma': 'trauma', 'neurological': 'neurology',
      'respiratory': 'respiratory', 'general': 'general',
      'orthopedic': 'orthopedics', 'pediatric': 'pediatrics'
    };

    const docSpec = req.user.specialization;
    if (docSpec && docSpec !== 'general') {
      const emCategory = emergency.aiTriage?.category?.toLowerCase() || 'general';
      const requiredSpec = CATEGORY_TO_SPEC[emCategory] || 'general';
      
      if (requiredSpec !== 'general' && requiredSpec !== docSpec && !emCategory.includes(docSpec.toLowerCase())) {
        return res.status(403).json({ message: `Access denied: This emergency requires a ${requiredSpec} specialist. You are a ${docSpec} specialist.` });
      }
    }

    // Assign doctor and update status immediately
    emergency.assignedDoctor = req.user._id;
    emergency.status = 'assigned';
    await emergency.save();

    const populated = await Emergency.findById(req.params.id)
      .populate('patientId', 'name email phone')
      .populate('assignedDoctor', 'name email specialization')
      .populate('assignedHospital');

    // Respond immediately - don't wait for AI summary
    res.json(populated);

    // Background: Generate AI Chat Summary (non-blocking)
    setImmediate(async () => {
      try {
        const fullEmergency = await Emergency.findById(req.params.id);
        const aiChat = await AIChat.findOne({ emergencyId: req.params.id });
        if (aiChat && aiChat.messages && aiChat.messages.length > 0) {
          // Pull wearable snapshot if stored in emergency record
          const wearableData = fullEmergency.wearableSnapshot || null;
          // Pull timeline events
          const timelineEvents = await timelineService.getEventsByEmergency(req.params.id);

          const emergencyData = {
            symptoms: fullEmergency.symptoms,
            severity: fullEmergency.severity,
            age: fullEmergency.age,
            bloodGroup: fullEmergency.bloodGroup,
            location: fullEmergency.location,
            transportType: fullEmergency.transportType,
            triageInputs: fullEmergency.triageInputs,
            additionalNotes: fullEmergency.additionalNotes,
            aiTriage: fullEmergency.aiTriage
          };
          const summary = await aiChatService.generateSummary(aiChat.messages, emergencyData, wearableData, timelineEvents);
          aiChat.summary = summary;
          await aiChat.save();
          await Emergency.findByIdAndUpdate(req.params.id, {
            'aiTriage.chatSummary': summary
          });
          console.log('✅ AI Chat Summary (with wearable data & timeline) generated for doctor (background)');
        }
      } catch (summaryErr) {
        console.error('⚠️ Could not generate AI chat summary:', summaryErr.message);
      }
    });

    // Background: Emit socket events and notifications (non-blocking)
    if (req.io) {
      req.io.to(`emergency_${emergency._id}`).emit('emergency_updated', populated);

      notificationService.createNotification(req.io, {
        recipient: emergency.patientId,
        title: '👨‍⚕️ Doctor Assigned',
        message: `Doctor ${req.user.name} has joined your emergency request.`,
        type: 'doctor_joined',
        referenceId: emergency._id,
        referenceModel: 'Emergency',
        priority: 'high'
      }).catch(err => console.error('Notification error:', err));

      timelineService.createEvent(
        emergency._id,
        TIMELINE_EVENT_TYPES.ASSIGNMENT,
        TIMELINE_TITLES.DOCTOR_ASSIGNED,
        `Dr. ${req.user.name} has been assigned to the case.`,
        { name: req.user.name, role: 'doctor' }
      ).catch(err => console.error('Timeline error:', err));
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to assign doctor', error: error.message });
  }
};


exports.assignDriver = async (req, res) => {
  try {
    const emergency = await Emergency.findById(req.params.id);
    if (!emergency) return res.status(404).json({ message: 'Emergency not found' });
    
    // Allow admin/doctor to forcefully assign, otherwise check pendingDriver
    if (req.user.role === 'driver') {
      if (emergency.assignedDriver) {
        return res.status(400).json({ message: 'Emergency already has an assigned driver' });
      }
      if (!emergency.pendingDriver || emergency.pendingDriver.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You are not the pending driver for this emergency.' });
      }
    }

    const driverId = req.user.role === 'driver' ? req.user._id : (req.body.driverId || req.user._id);

    emergency.assignedDriver = driverId;
    emergency.pendingDriver = null; // Clear pending
    emergency.status = 'assigned';
    await emergency.save();

    // Update driver status to busy
    await User.findByIdAndUpdate(driverId, { availabilityStatus: 'busy' });

    const populated = await Emergency.findById(req.params.id)
      .populate('patientId', 'name email phone')
      .populate('assignedDoctor', 'name email specialization')
      .populate('assignedDriver', 'name email vehicleNumber');

    if (req.io) {
      req.io.to(`emergency_${emergency._id}`).emit('emergency_updated', populated);

      // Notify patient
      await notificationService.createNotification(req.io, {
        recipient: populated.patientId._id,
        title: '🚑 Ambulance Assigned',
        message: `Ambulance ${populated.assignedDriver?.vehicleNumber || ''} is on the way.`,
        type: 'ambulance_assigned',
        referenceId: emergency._id,
        referenceModel: 'Emergency',
        priority: 'high'
      });

      // Create Timeline Event
      await timelineService.createEvent(
        emergency._id,
        TIMELINE_EVENT_TYPES.ASSIGNMENT,
        TIMELINE_TITLES.AMBULANCE_DISPATCHED,
        `Ambulance/Driver ${populated.assignedDriver?.name || ''} accepted the dispatch.`,
        { name: req.user.name, role: req.user.role }
      );
    }

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Failed to assign driver', error: error.message });
  }
};

exports.declineDispatch = async (req, res) => {
  try {
    const emergency = await Emergency.findById(req.params.id);
    if (!emergency) return res.status(404).json({ message: 'Emergency not found' });

    if (emergency.pendingDriver && emergency.pendingDriver.toString() === req.user._id.toString()) {
      emergency.pendingDriver = null;
      emergency.ignoredDrivers.push(req.user._id);
      await emergency.save();

      // Trigger next dispatch
      dispatchService.assignNearestAmbulance(req.io, emergency._id);
    }

    res.json({ message: 'Dispatch declined successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to decline dispatch', error: error.message });
  }
};

exports.resolveEmergency = async (req, res) => {
  try {
    const { resolutionNotes } = req.body;
    const emergency = await Emergency.findByIdAndUpdate(
      req.params.id,
      { status: 'resolved', resolutionNotes, resolvedAt: new Date() },
      { new: true }
    ).populate('patientId', 'name email phone')
     .populate('assignedDoctor', 'name email specialization')
     .populate('assignedDriver', 'name email vehicleNumber');

    if (req.io) {
      req.io.to(`emergency_${emergency._id}`).emit('emergency_updated', emergency);

      // Create Timeline Event
      await timelineService.createEvent(
        emergency._id,
        TIMELINE_EVENT_TYPES.STATUS_CHANGE,
        TIMELINE_TITLES.EMERGENCY_RESOLVED,
        `The emergency has been marked as resolved. Notes: ${resolutionNotes || 'None'}`,
        { name: req.user.name, role: 'doctor' }
      );
    }

    res.json(emergency);
  } catch (error) {
    res.status(500).json({ message: 'Failed to resolve emergency', error: error.message });
  }
};

exports.getActiveEmergencies = async (req, res) => {
  try {
    const CATEGORY_TO_SPEC = {
      'cardiac': 'cardiology',
      'cardiovascular': 'cardiology',
      'trauma': 'trauma',
      'neurological': 'neurology',
      'respiratory': 'respiratory',
      'general': 'general',
      'orthopedic': 'orthopedics',
      'pediatric': 'pediatrics'
    };

    let filter = {
      status: { $in: ['pending', 'assigned', 'in_progress', 'dropped_off'] }
    };

    // Strictly filter by Hospital Affiliation
    if (req.user.role === 'doctor' && req.user.hospitalAffiliation) {
      const Hospital = require('../models/Hospital');
      const myHospital = await Hospital.findOne({ name: new RegExp('^' + req.user.hospitalAffiliation + '$', 'i') });
      if (myHospital) {
        filter.assignedHospital = myHospital._id;
      }
    }

    // Strictly filter by Doctor's Specialization
    if (req.user.role === 'doctor' && req.user.specialization) {
      const matchingCategories = Object.entries(CATEGORY_TO_SPEC)
        .filter(([_, spec]) => spec === req.user.specialization)
        .map(([cat]) => cat);
      
      // If the doctor is "general", matchingCategories will include "general".
      // They should ONLY see cases that are mapped to their specialty or explicitly assigned to them.
      filter.$or = [
        { 'aiTriage.category': { $in: matchingCategories } },
        { 'aiTriage.category': { $regex: new RegExp(req.user.specialization, 'i') } },
        { assignedDoctor: req.user._id }
      ];
    }

    const emergencies = await Emergency.find(filter)
      .populate('patientId', 'name email phone')
      .populate('assignedDoctor', 'name email specialization')
      .populate('assignedDriver', 'name email vehicleNumber')
      .populate('assignedHospital')
      .sort({ 'aiTriage.severityScore': -1, createdAt: -1 });

    res.json(emergencies);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch active emergencies', error: error.message });
  }
};

exports.getTimeline = async (req, res) => {
  try {
    const events = await timelineService.getEventsByEmergency(req.params.id);
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch timeline', error: error.message });
  }
};
