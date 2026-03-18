import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { MongoClient } from "npm:mongodb@6.3.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface TimeSlot {
  start: string;
  end: string;
}

interface DoctorAvailability {
  id: string;
  doctorId: string;
  date: string;
  timeSlots: TimeSlot[];
  isOnlineAvailable: boolean;
  isOfflineAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  date: string;
  timeSlot: TimeSlot;
  mode: 'online' | 'offline';
  status: 'pending' | 'approved' | 'live' | 'completed' | 'cancelled';
  zoomUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

function normalizeMongoUri(mongoUri: string): string {
  const url = new URL(mongoUri);
  if (!url.username && !url.password) return mongoUri;
  const username = encodeURIComponent(url.username);
  const password = encodeURIComponent(url.password);
  return `${url.protocol}//${username}:${password}@${url.host}${url.pathname}${url.search}`;
}

let cachedClient: MongoClient | null = null;

async function getMongoClient(): Promise<MongoClient> {
  const rawMongoUri = Deno.env.get("MONGODB_URI");
  if (!rawMongoUri) {
    throw new Error("MONGODB_URI not configured");
  }
  
  const mongoUri = normalizeMongoUri(rawMongoUri);
  
  if (cachedClient) {
    return cachedClient;
  }
  
  cachedClient = new MongoClient(mongoUri);
  await cachedClient.connect();
  console.log("Connected to MongoDB for appointments");
  return cachedClient;
}

async function sendEmailNotification(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.log("RESEND_API_KEY not configured, skipping email");
    return;
  }

  try {
    const resend = new Resend(resendApiKey);
    const result = await resend.emails.send({
      from: "Health Appointments <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    });
    console.log("Email sent successfully:", result);
  } catch (error) {
    console.error("Failed to send email:", error);
  }
}

async function createAppointmentNotification(
  db: any,
  patientId: string,
  type: 'appointment_approved' | 'appointment_cancelled' | 'appointment_live' | 'appointment_completed' | 'appointment_booked',
  message: string,
  appointmentId: string
): Promise<void> {
  const notificationsCollection = db.collection("notifications");
  await notificationsCollection.insertOne({
    patientId,
    type,
    message,
    appointmentId,
    read: false,
    createdAt: new Date(),
  });
  console.log("Appointment notification created for patient:", patientId);
}

function getStatusEmoji(status: string): string {
  switch (status) {
    case 'approved': return '✅';
    case 'cancelled': return '❌';
    case 'live': return '🎥';
    case 'completed': return '✔️';
    default: return '📅';
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'approved': return '#22c55e';
    case 'cancelled': return '#ef4444';
    case 'live': return '#3b82f6';
    case 'completed': return '#8b5cf6';
    default: return '#6b7280';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...data } = await req.json();
    console.log('Appointments action:', action, 'data:', JSON.stringify(data).substring(0, 200));

    const client = await getMongoClient();
    const db = client.db("healthrecords");
    const availabilityCollection = db.collection("doctorAvailability");
    const appointmentsCollection = db.collection("appointments");
    const patientsCollection = db.collection("approved_patients");

    let result;

    switch (action) {
      // ============ AVAILABILITY ACTIONS ============
      case 'set-availability': {
        const { doctorId, date, timeSlots, isOnlineAvailable, isOfflineAvailable } = data;
        const now = new Date().toISOString();
        
        const existing = await availabilityCollection.findOne({ doctorId, date });
        
        if (existing) {
          await availabilityCollection.updateOne(
            { doctorId, date },
            {
              $set: {
                timeSlots,
                isOnlineAvailable,
                isOfflineAvailable,
                updatedAt: now
              }
            }
          );
          result = { success: true, message: 'Availability updated' };
        } else {
          const availability: DoctorAvailability = {
            id: crypto.randomUUID(),
            doctorId,
            date,
            timeSlots,
            isOnlineAvailable,
            isOfflineAvailable,
            createdAt: now,
            updatedAt: now
          };
          await availabilityCollection.insertOne(availability);
          result = { success: true, message: 'Availability created', availability };
        }
        break;
      }

      case 'get-availability': {
        const { doctorId, startDate, endDate } = data;
        const filter: any = { doctorId };
        
        if (startDate && endDate) {
          filter.date = { $gte: startDate, $lte: endDate };
        }
        
        const documents = await availabilityCollection.find(filter).sort({ date: 1 }).toArray();
        result = { documents };
        break;
      }

      case 'get-all-available-doctors': {
        const { date } = data;
        const documents = await availabilityCollection.find({
          date,
          $or: [
            { isOnlineAvailable: true },
            { isOfflineAvailable: true }
          ]
        }).toArray();
        result = { documents };
        break;
      }

      case 'delete-availability': {
        const { doctorId, date } = data;
        await availabilityCollection.deleteOne({ doctorId, date });
        result = { success: true, message: 'Availability deleted' };
        break;
      }

      // ============ APPOINTMENT ACTIONS ============
      case 'create-appointment': {
        const { patientId, patientName, doctorId, doctorName, doctorSpecialization, date, timeSlot, mode, notes } = data;
        const now = new Date().toISOString();
        
        const appointment: Appointment = {
          id: crypto.randomUUID(),
          patientId,
          patientName,
          doctorId,
          doctorName,
          doctorSpecialization,
          date,
          timeSlot,
          mode,
          status: 'pending',
          notes,
          createdAt: now,
          updatedAt: now
        };
        
        await appointmentsCollection.insertOne(appointment);
        
        // Create notification for patient
        await createAppointmentNotification(
          db,
          patientId,
          'appointment_booked',
          `Your ${mode} appointment with Dr. ${doctorName} on ${date} at ${timeSlot.start} has been booked and is pending approval.`,
          appointment.id
        );

        // Send email to patient
        const patient = await patientsCollection.findOne({ id: patientId });
        if (patient?.email) {
          await sendEmailNotification(
            patient.email,
            '📅 Appointment Booked - Pending Approval',
            `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #3b82f6;">Appointment Booked!</h1>
                <p>Dear ${patientName},</p>
                <p>Your appointment request has been submitted and is pending approval.</p>
                <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0;"><strong>Doctor:</strong> Dr. ${doctorName} (${doctorSpecialization})</p>
                  <p style="margin: 8px 0 0;"><strong>Date:</strong> ${date}</p>
                  <p style="margin: 8px 0 0;"><strong>Time:</strong> ${timeSlot.start} - ${timeSlot.end}</p>
                  <p style="margin: 8px 0 0;"><strong>Mode:</strong> ${mode === 'online' ? '🎥 Online Consultation' : '🏥 In-Person Visit'}</p>
                </div>
                <p>You will receive another notification once the doctor approves your appointment.</p>
                <p style="color: #6b7280; font-size: 14px;">Best regards,<br>Health Appointments Team</p>
              </div>
            `
          );
        }
        
        result = { success: true, appointment };
        break;
      }

      case 'get-patient-appointments': {
        const { patientId } = data;
        const documents = await appointmentsCollection
          .find({ patientId })
          .sort({ date: -1, 'timeSlot.start': -1 })
          .toArray();
        result = { documents };
        break;
      }

      case 'get-doctor-appointments': {
        const { doctorId, status } = data;
        const filter: any = { doctorId };
        if (status) filter.status = status;
        
        const documents = await appointmentsCollection
          .find(filter)
          .sort({ date: 1, 'timeSlot.start': 1 })
          .toArray();
        result = { documents };
        break;
      }

      case 'update-appointment-status': {
        const { appointmentId, status, zoomUrl } = data;
        const now = new Date().toISOString();
        
        // Get appointment first for notification
        const appointment = await appointmentsCollection.findOne({ id: appointmentId });
        if (!appointment) {
          throw new Error('Appointment not found');
        }
        
        const updateData: any = { status, updatedAt: now };
        if (zoomUrl !== undefined) updateData.zoomUrl = zoomUrl;
        
        await appointmentsCollection.updateOne(
          { id: appointmentId },
          { $set: updateData }
        );

        // Create notification and send email based on status
        const patient = await patientsCollection.findOne({ id: appointment.patientId });
        const patientEmail = patient?.email;

        let notificationType: 'appointment_approved' | 'appointment_cancelled' | 'appointment_live' | 'appointment_completed';
        let notificationMessage: string;
        let emailSubject: string;
        let emailContent: string;

        switch (status) {
          case 'approved':
            notificationType = 'appointment_approved';
            notificationMessage = `Your appointment with Dr. ${appointment.doctorName} on ${appointment.date} at ${appointment.timeSlot.start} has been approved!`;
            emailSubject = '✅ Appointment Approved';
            emailContent = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #22c55e;">Appointment Approved!</h1>
                <p>Dear ${appointment.patientName},</p>
                <p>Great news! Your appointment has been approved by the doctor.</p>
                <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0;"><strong>Doctor:</strong> Dr. ${appointment.doctorName} (${appointment.doctorSpecialization})</p>
                  <p style="margin: 8px 0 0;"><strong>Date:</strong> ${appointment.date}</p>
                  <p style="margin: 8px 0 0;"><strong>Time:</strong> ${appointment.timeSlot.start} - ${appointment.timeSlot.end}</p>
                  <p style="margin: 8px 0 0;"><strong>Mode:</strong> ${appointment.mode === 'online' ? '🎥 Online Consultation' : '🏥 In-Person Visit'}</p>
                </div>
                ${appointment.mode === 'online' ? '<p>You will receive the Zoom meeting link before your appointment.</p>' : '<p>Please arrive 10 minutes before your scheduled time.</p>'}
                <p style="color: #6b7280; font-size: 14px;">Best regards,<br>Health Appointments Team</p>
              </div>
            `;
            break;

          case 'cancelled':
            notificationType = 'appointment_cancelled';
            notificationMessage = `Your appointment with Dr. ${appointment.doctorName} on ${appointment.date} has been cancelled.`;
            emailSubject = '❌ Appointment Cancelled';
            emailContent = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #ef4444;">Appointment Cancelled</h1>
                <p>Dear ${appointment.patientName},</p>
                <p>Unfortunately, your appointment has been cancelled.</p>
                <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                  <p style="margin: 0;"><strong>Doctor:</strong> Dr. ${appointment.doctorName}</p>
                  <p style="margin: 8px 0 0;"><strong>Original Date:</strong> ${appointment.date}</p>
                  <p style="margin: 8px 0 0;"><strong>Original Time:</strong> ${appointment.timeSlot.start} - ${appointment.timeSlot.end}</p>
                </div>
                <p>Please book a new appointment at your convenience.</p>
                <p style="color: #6b7280; font-size: 14px;">Best regards,<br>Health Appointments Team</p>
              </div>
            `;
            break;

          case 'live':
            notificationType = 'appointment_live';
            notificationMessage = `Your online consultation with Dr. ${appointment.doctorName} is now live! ${zoomUrl ? 'Join the meeting now.' : ''}`;
            emailSubject = '🎥 Your Consultation is Live!';
            emailContent = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #3b82f6;">Your Consultation is Live!</h1>
                <p>Dear ${appointment.patientName},</p>
                <p>Dr. ${appointment.doctorName} is ready for your online consultation.</p>
                ${zoomUrl ? `
                  <div style="background: #eff6ff; padding: 16px; border-radius: 8px; margin: 20px 0; text-align: center;">
                    <p style="margin: 0 0 12px;"><strong>Join your consultation now:</strong></p>
                    <a href="${zoomUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                      Join Zoom Meeting
                    </a>
                  </div>
                ` : '<p>Please log into your account to join the meeting.</p>'}
                <p style="color: #6b7280; font-size: 14px;">Best regards,<br>Health Appointments Team</p>
              </div>
            `;
            break;

          case 'completed':
            notificationType = 'appointment_completed';
            notificationMessage = `Your appointment with Dr. ${appointment.doctorName} has been completed. Thank you for choosing our service!`;
            emailSubject = '✔️ Appointment Completed';
            emailContent = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #8b5cf6;">Appointment Completed</h1>
                <p>Dear ${appointment.patientName},</p>
                <p>Your appointment with Dr. ${appointment.doctorName} has been completed.</p>
                <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0;"><strong>Doctor:</strong> Dr. ${appointment.doctorName} (${appointment.doctorSpecialization})</p>
                  <p style="margin: 8px 0 0;"><strong>Date:</strong> ${appointment.date}</p>
                </div>
                <p>Thank you for choosing our healthcare services. We hope you had a great experience!</p>
                <p style="color: #6b7280; font-size: 14px;">Best regards,<br>Health Appointments Team</p>
              </div>
            `;
            break;

          default:
            notificationType = 'appointment_approved';
            notificationMessage = `Your appointment status has been updated to ${status}.`;
            emailSubject = `📅 Appointment Update`;
            emailContent = `<p>Your appointment status has been updated to ${status}.</p>`;
        }

        // Create in-app notification
        await createAppointmentNotification(
          db,
          appointment.patientId,
          notificationType,
          notificationMessage,
          appointmentId
        );

        // Send email notification
        if (patientEmail) {
          await sendEmailNotification(patientEmail, emailSubject, emailContent);
        }
        
        result = { success: true, message: `Appointment ${status}` };
        break;
      }

      case 'set-zoom-url': {
        const { appointmentId, zoomUrl } = data;
        const now = new Date().toISOString();
        
        // Get appointment first
        const appointment = await appointmentsCollection.findOne({ id: appointmentId });
        if (!appointment) {
          throw new Error('Appointment not found');
        }
        
        await appointmentsCollection.updateOne(
          { id: appointmentId },
          { $set: { zoomUrl, updatedAt: now } }
        );

        // Notify patient about Zoom link
        await createAppointmentNotification(
          db,
          appointment.patientId,
          'appointment_live',
          `Zoom link added for your appointment with Dr. ${appointment.doctorName} on ${appointment.date}. Join when your consultation starts!`,
          appointmentId
        );

        // Send email with Zoom link
        const patient = await patientsCollection.findOne({ id: appointment.patientId });
        if (patient?.email) {
          await sendEmailNotification(
            patient.email,
            '🎥 Zoom Link for Your Appointment',
            `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #3b82f6;">Zoom Link Ready!</h1>
                <p>Dear ${appointment.patientName},</p>
                <p>The Zoom link for your upcoming appointment is now available.</p>
                <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0;"><strong>Doctor:</strong> Dr. ${appointment.doctorName}</p>
                  <p style="margin: 8px 0 0;"><strong>Date:</strong> ${appointment.date}</p>
                  <p style="margin: 8px 0 0;"><strong>Time:</strong> ${appointment.timeSlot.start} - ${appointment.timeSlot.end}</p>
                </div>
                <div style="background: #eff6ff; padding: 16px; border-radius: 8px; margin: 20px 0; text-align: center;">
                  <a href="${zoomUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                    Join Zoom Meeting
                  </a>
                </div>
                <p style="color: #6b7280; font-size: 12px;">Please join the meeting at your scheduled time.</p>
                <p style="color: #6b7280; font-size: 14px;">Best regards,<br>Health Appointments Team</p>
              </div>
            `
          );
        }
        
        result = { success: true, message: 'Zoom URL set' };
        break;
      }

      case 'cancel-appointment': {
        const { appointmentId } = data;
        const now = new Date().toISOString();
        
        // Get appointment first
        const appointment = await appointmentsCollection.findOne({ id: appointmentId });
        if (!appointment) {
          throw new Error('Appointment not found');
        }
        
        await appointmentsCollection.updateOne(
          { id: appointmentId },
          { $set: { status: 'cancelled', updatedAt: now } }
        );

        // Notify patient
        await createAppointmentNotification(
          db,
          appointment.patientId,
          'appointment_cancelled',
          `Your appointment with Dr. ${appointment.doctorName} on ${appointment.date} at ${appointment.timeSlot.start} has been cancelled.`,
          appointmentId
        );

        // Send cancellation email
        const patient = await patientsCollection.findOne({ id: appointment.patientId });
        if (patient?.email) {
          await sendEmailNotification(
            patient.email,
            '❌ Appointment Cancelled',
            `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #ef4444;">Appointment Cancelled</h1>
                <p>Dear ${appointment.patientName},</p>
                <p>Your appointment has been cancelled.</p>
                <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                  <p style="margin: 0;"><strong>Doctor:</strong> Dr. ${appointment.doctorName}</p>
                  <p style="margin: 8px 0 0;"><strong>Date:</strong> ${appointment.date}</p>
                  <p style="margin: 8px 0 0;"><strong>Time:</strong> ${appointment.timeSlot.start} - ${appointment.timeSlot.end}</p>
                </div>
                <p>You can book a new appointment at your convenience.</p>
                <p style="color: #6b7280; font-size: 14px;">Best regards,<br>Health Appointments Team</p>
              </div>
            `
          );
        }
        
        result = { success: true, message: 'Appointment cancelled' };
        break;
      }

      case 'get-appointment-by-id': {
        const { appointmentId } = data;
        const document = await appointmentsCollection.findOne({ id: appointmentId });
        result = { document };
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Appointments error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
