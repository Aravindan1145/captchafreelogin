import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { MongoClient, ObjectId } from "npm:mongodb@6.3.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ReportRequest {
  action: 'create' | 'update' | 'get' | 'get-by-patient' | 'get-by-doctor' | 'get-pending' | 'confirm' | 'reject' | 'get-notifications' | 'mark-notification-read';
  reportId?: string;
  patientId?: string;
  doctorId?: string;
  notificationId?: string;
  reportData?: {
    id?: string;
    patientId: string;
    patientName: string;
    patientEmail?: string;
    doctorId?: string;
    doctorName?: string;
    doctorLicense?: string;
    date: string;
    symptoms: string[];
    diagnosis: string[];
    testsconducted: string[];
    treatmentPlan: string[];
    additionalNotes: string;
    status: 'draft' | 'submitted' | 'confirmed' | 'rejected';
    isEditable: boolean;
    images?: Array<{
      id: string;
      imageName: string;
      imageData: string;
      createdAt: string;
    }>;
  };
  confirmData?: {
    doctorId: string;
    doctorName: string;
    doctorLicense: string;
  };
  rejectReason?: string;
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
  console.log("Connected to MongoDB for reports");
  return cachedClient;
}

const generateReportId = (): string => {
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `REP${random}`;
};

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
      from: "Health Reports <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    });
    console.log("Email sent successfully:", result);
  } catch (error) {
    console.error("Failed to send email:", error);
  }
}

async function createNotification(
  db: any,
  patientId: string,
  type: 'approved' | 'rejected',
  message: string,
  reportId: string
): Promise<void> {
  const notificationsCollection = db.collection("notifications");
  await notificationsCollection.insertOne({
    patientId,
    type,
    message,
    reportId,
    read: false,
    createdAt: new Date(),
  });
  console.log("Notification created for patient:", patientId);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: ReportRequest = await req.json();
    console.log('MongoDB Reports API called with action:', body.action);

    const client = await getMongoClient();
    const db = client.db("health_reports");
    const reportsCollection = db.collection("medical_reports");
    const patientsCollection = db.collection("approved_patients");

    let result;

    switch (body.action) {
      case 'create': {
        if (!body.reportData) {
          throw new Error('Missing required field: reportData');
        }
        
        // Clean and validate report data
        const reportData = body.reportData;

        // Prefer a stable client-provided id (so image uploads can be linked to the report)
        let finalReportId = (reportData.id || '').trim();
        if (!finalReportId) {
          finalReportId = generateReportId();
        }

        // Avoid rare collisions
        for (let i = 0; i < 5; i++) {
          const existing = await reportsCollection.findOne(
            { id: finalReportId },
            { projection: { _id: 1 } }
          );
          if (!existing) break;
          finalReportId = generateReportId();
        }

        const newReport = {
          id: finalReportId,
          patientId: reportData.patientId,
          patientName: reportData.patientName,
          patientEmail: reportData.patientEmail || '',
          doctorId: reportData.doctorId || null,
          doctorName: reportData.doctorName || null,
          doctorLicense: reportData.doctorLicense || null,
          date: reportData.date,
          symptoms: (reportData.symptoms || []).filter((s: string) => s && s.trim()),
          diagnosis: (reportData.diagnosis || []).filter((d: string) => d && d.trim()),
          testsconducted: (reportData.testsconducted || []).filter((t: string) => t && t.trim()),
          treatmentPlan: (reportData.treatmentPlan || []).filter((t: string) => t && t.trim()),
          additionalNotes: reportData.additionalNotes || '',
          status: reportData.status || 'draft',
          isEditable: reportData.isEditable !== false,
          images: reportData.images || [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        await reportsCollection.insertOne(newReport);
        console.log('Report created successfully:', newReport.id, 'with', newReport.symptoms.length, 'symptoms');
        
        result = { 
          success: true, 
          report: newReport,
          message: 'Report created successfully' 
        };
        break;
      }

      case 'update': {
        if (!body.reportId || !body.reportData) {
          throw new Error('Missing required fields: reportId and reportData');
        }
        
        // Clean and validate update data
        const updateData: Record<string, any> = {
          updatedAt: new Date()
        };
        
        const rd = body.reportData;
        if (rd.patientName !== undefined) updateData.patientName = rd.patientName;
        if (rd.patientEmail !== undefined) updateData.patientEmail = rd.patientEmail;
        if (rd.doctorId !== undefined) updateData.doctorId = rd.doctorId;
        if (rd.doctorName !== undefined) updateData.doctorName = rd.doctorName;
        if (rd.doctorLicense !== undefined) updateData.doctorLicense = rd.doctorLicense;
        if (rd.date !== undefined) updateData.date = rd.date;
        if (rd.symptoms !== undefined) updateData.symptoms = rd.symptoms.filter((s: string) => s && s.trim());
        if (rd.diagnosis !== undefined) updateData.diagnosis = rd.diagnosis.filter((d: string) => d && d.trim());
        if (rd.testsconducted !== undefined) updateData.testsconducted = rd.testsconducted.filter((t: string) => t && t.trim());
        if (rd.treatmentPlan !== undefined) updateData.treatmentPlan = rd.treatmentPlan.filter((t: string) => t && t.trim());
        if (rd.additionalNotes !== undefined) updateData.additionalNotes = rd.additionalNotes;
        if (rd.status !== undefined) updateData.status = rd.status;
        if (rd.isEditable !== undefined) updateData.isEditable = rd.isEditable;
        if (rd.images !== undefined) updateData.images = rd.images;
        
        const updateResult = await reportsCollection.updateOne(
          { id: body.reportId },
          { $set: updateData }
        );
        
        console.log('Report updated:', body.reportId, 'modified:', updateResult.modifiedCount, 'data:', JSON.stringify(updateData).slice(0, 200));
        
        result = { 
          success: true, 
          message: 'Report updated successfully' 
        };
        break;
      }

      case 'get': {
        if (!body.reportId) {
          throw new Error('Missing required field: reportId');
        }
        
        const report = await reportsCollection.findOne({ id: body.reportId });
        console.log('Found report:', body.reportId);
        
        result = { 
          success: true, 
          report: report || null
        };
        break;
      }

      case 'get-by-patient': {
        if (!body.patientId) {
          throw new Error('Missing required field: patientId');
        }
        
        const reports = await reportsCollection.find({ patientId: body.patientId }).toArray();
        console.log(`Found ${reports.length} reports for patient:`, body.patientId);
        
        result = { 
          success: true, 
          reports 
        };
        break;
      }

      case 'get-by-doctor': {
        if (!body.doctorId) {
          throw new Error('Missing required field: doctorId');
        }
        
        const reports = await reportsCollection.find({ doctorId: body.doctorId }).toArray();
        console.log(`Found ${reports.length} reports for doctor:`, body.doctorId);
        
        result = { 
          success: true, 
          reports 
        };
        break;
      }

      case 'get-pending': {
        const reports = await reportsCollection.find({ status: 'submitted' }).toArray();
        console.log(`Found ${reports.length} pending reports`);
        
        result = { 
          success: true, 
          reports 
        };
        break;
      }

      case 'get-notifications': {
        if (!body.patientId) {
          throw new Error('Missing required field: patientId');
        }
        
        const notificationsCollection = db.collection("notifications");
        const notifications = await notificationsCollection
          .find({ patientId: body.patientId })
          .sort({ createdAt: -1 })
          .limit(10)
          .toArray();
        
        console.log(`Found ${notifications.length} notifications for patient:`, body.patientId);
        
        result = { 
          success: true, 
          notifications: notifications.map((n: any) => ({
            id: n._id.toString(),
            type: n.type,
            message: n.message,
            reportId: n.reportId,
            read: n.read,
            createdAt: n.createdAt,
          }))
        };
        break;
      }

      case 'mark-notification-read': {
        if (!body.notificationId) {
          throw new Error('Missing required field: notificationId');
        }
        
        const notificationsCollection = db.collection("notifications");
        await notificationsCollection.updateOne(
          { _id: new ObjectId(body.notificationId) },
          { $set: { read: true } }
        );
        
        console.log('Notification marked as read:', body.notificationId);
        
        result = { 
          success: true, 
          message: 'Notification marked as read' 
        };
        break;
      }

      case 'confirm': {
        if (!body.reportId || !body.confirmData) {
          throw new Error('Missing required fields: reportId and confirmData');
        }
        
        // Get the report first to get patient info
        const report = await reportsCollection.findOne({ id: body.reportId });
        if (!report) {
          throw new Error('Report not found');
        }

        const confirmNote = `\n\nConfirmed by Dr. ${body.confirmData.doctorName} (License: ${body.confirmData.doctorLicense}) on ${new Date().toLocaleDateString()}`;
        
        await reportsCollection.updateOne(
          { id: body.reportId },
          { 
            $set: { 
              status: 'confirmed',
              isEditable: false,
              doctorId: body.confirmData.doctorId,
              doctorName: body.confirmData.doctorName,
              doctorLicense: body.confirmData.doctorLicense,
              additionalNotes: (report.additionalNotes || '') + confirmNote,
              updatedAt: new Date()
            }
          }
        );
        
        console.log('Report confirmed:', body.reportId);

        // Create notification for patient
        await createNotification(
          db,
          report.patientId,
          'approved',
          `Your medical report (${body.reportId}) has been approved by Dr. ${body.confirmData.doctorName}`,
          body.reportId
        );

        // Send email notification
        const patient = await patientsCollection.findOne({ id: report.patientId });
        if (patient?.email) {
          await sendEmailNotification(
            patient.email,
            '✅ Your Medical Report Has Been Approved',
            `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #22c55e;">Report Approved!</h1>
                <p>Dear ${report.patientName},</p>
                <p>Your medical report <strong>${body.reportId}</strong> has been reviewed and approved by <strong>Dr. ${body.confirmData.doctorName}</strong>.</p>
                <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0;"><strong>Report Date:</strong> ${report.date}</p>
                  <p style="margin: 8px 0 0;"><strong>Doctor License:</strong> ${body.confirmData.doctorLicense}</p>
                </div>
                <p>You can view the full report by logging into your account.</p>
                <p style="color: #6b7280; font-size: 14px;">Best regards,<br>Health Reports Team</p>
              </div>
            `
          );
        }
        
        result = { 
          success: true, 
          message: 'Report confirmed successfully' 
        };
        break;
      }

      case 'reject': {
        if (!body.reportId) {
          throw new Error('Missing required field: reportId');
        }
        
        // Get the report first to get patient info
        const report = await reportsCollection.findOne({ id: body.reportId });
        if (!report) {
          throw new Error('Report not found');
        }

        const rejectNote = `\n\nRejected on ${new Date().toLocaleDateString()}` + 
          (body.rejectReason ? `\nReason: ${body.rejectReason}` : '');
        
        await reportsCollection.updateOne(
          { id: body.reportId },
          { 
            $set: { 
              status: 'rejected',
              isEditable: true,
              additionalNotes: (report.additionalNotes || '') + rejectNote,
              updatedAt: new Date()
            }
          }
        );
        
        console.log('Report rejected:', body.reportId);

        // Create notification for patient
        await createNotification(
          db,
          report.patientId,
          'rejected',
          `Your medical report (${body.reportId}) needs revision. ${body.rejectReason || 'Please update and resubmit.'}`,
          body.reportId
        );

        // Send email notification
        const patient = await patientsCollection.findOne({ id: report.patientId });
        if (patient?.email) {
          await sendEmailNotification(
            patient.email,
            '⚠️ Your Medical Report Needs Revision',
            `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #f59e0b;">Report Needs Revision</h1>
                <p>Dear ${report.patientName},</p>
                <p>Your medical report <strong>${body.reportId}</strong> has been reviewed and requires some changes before it can be approved.</p>
                ${body.rejectReason ? `
                  <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                    <p style="margin: 0; font-weight: bold;">Reason:</p>
                    <p style="margin: 8px 0 0;">${body.rejectReason}</p>
                  </div>
                ` : ''}
                <p>Please log into your account to review and update your report.</p>
                <p style="color: #6b7280; font-size: 14px;">Best regards,<br>Health Reports Team</p>
              </div>
            `
          );
        }
        
        result = { 
          success: true, 
          message: 'Report rejected successfully' 
        };
        break;
      }

      default:
        throw new Error('Invalid action');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('MongoDB Reports API error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
