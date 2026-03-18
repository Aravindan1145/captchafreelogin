import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { MongoClient, ObjectId } from "npm:mongodb@6.3.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface UserRequest {
  action: "register" | "get-pending" | "approve" | "reject" | "login" | "get-approved-doctors" | "change-password";
  userType?: "doctor" | "patient" | "admin";
  userData?: {
    name: string;
    email: string;
    specialization?: string;
    licenseNumber?: string;
  };
  userId?: string;
  credentials?: {
    id: string;
    password: string;
  };
  passwordData?: {
    userId: string;
    currentPassword: string;
    newPassword: string;
  };
}

const generateUserId = (type: string): string => {
  const prefix = type === "doctor" ? "DOC" : "PAT";
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}${random}`;
};

const generatePassword = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

let cachedClient: MongoClient | null = null;
let cachedMongoUri: string | null = null;

function normalizeMongoUri(mongoUri: string): string {
  // Canonicalize the URI so usernames/passwords are safely URL-encoded.
  // This prevents common Atlas auth failures when passwords contain special chars (e.g. @, #, :).
  const url = new URL(mongoUri);

  // If there are no credentials, nothing to normalize.
  if (!url.username && !url.password) return mongoUri;

  const username = encodeURIComponent(url.username);
  const password = encodeURIComponent(url.password);

  return `${url.protocol}//${username}:${password}@${url.host}${url.pathname}${url.search}`;
}

async function getMongoClient(): Promise<MongoClient> {
  const rawMongoUri = Deno.env.get("MONGODB_URI");
  if (!rawMongoUri) {
    throw new Error("MONGODB_URI not configured");
  }

  const mongoUri = normalizeMongoUri(rawMongoUri);

  if (cachedClient && cachedMongoUri === mongoUri) {
    return cachedClient;
  }

  // If the secret was updated but the function instance is still warm, recycle the connection.
  if (cachedClient && cachedMongoUri && cachedMongoUri !== mongoUri) {
    try {
      await cachedClient.close();
    } catch {
      // ignore
    }
    cachedClient = null;
    cachedMongoUri = null;
  }

  const client = new MongoClient(mongoUri);
  await client.connect();

  cachedClient = client;
  cachedMongoUri = mongoUri;

  try {
    const u = new URL(mongoUri);
    console.log("Connected to MongoDB:", { host: u.host, username: u.username });
  } catch {
    console.log("Connected to MongoDB");
  }

  return client;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const client = await getMongoClient();
    const db = client.db("health_reports");
    const pendingDoctors = db.collection("pending_doctors");
    const pendingPatients = db.collection("pending_patients");
    const approvedDoctors = db.collection("approved_doctors");
    const approvedPatients = db.collection("approved_patients");
    const admins = db.collection("admins");

    const { action, userType, userData, userId, credentials, passwordData }: UserRequest = await req.json();
    console.log(`Processing action: ${action}, userType: ${userType}`);

    // Initialize default admin if not exists
    const existingAdmin = await admins.findOne({ id: "ADMIN001" });
    if (!existingAdmin) {
      await admins.insertOne({
        id: "ADMIN001",
        name: "System Administrator",
        password: "admin123",
        createdAt: new Date(),
      });
      console.log("Default admin created");
    }

    switch (action) {
      case "register": {
        if (!userData || !userType) {
          throw new Error("Missing user data or type");
        }

        const collection = userType === "doctor" ? pendingDoctors : pendingPatients;
        const newUser = {
          ...userData,
          status: "pending",
          registeredAt: new Date(),
        };

        const result = await collection.insertOne(newUser);
        console.log(`New ${userType} registered with id: ${result.insertedId.toString()}`);

        return new Response(
          JSON.stringify({ success: true, message: "Registration submitted for approval" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get-pending": {
        const doctors = await pendingDoctors.find({ status: "pending" }).toArray();
        const patients = await pendingPatients.find({ status: "pending" }).toArray();

        const formattedDoctors = doctors.map((d: any) => ({
          _id: d._id.toString(),
          name: d.name,
          email: d.email,
          specialization: d.specialization,
          licenseNumber: d.licenseNumber,
          registeredAt: d.registeredAt,
        }));

        const formattedPatients = patients.map((p: any) => ({
          _id: p._id.toString(),
          name: p.name,
          email: p.email,
          registeredAt: p.registeredAt,
        }));

        return new Response(
          JSON.stringify({ 
            success: true, 
            pendingDoctors: formattedDoctors, 
            pendingPatients: formattedPatients 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "approve": {
        if (!userId || !userType) {
          throw new Error("Missing userId or userType");
        }

        const pendingCollection = userType === "doctor" ? pendingDoctors : pendingPatients;
        const approvedCollection = userType === "doctor" ? approvedDoctors : approvedPatients;

        const pendingUser = await pendingCollection.findOne({ _id: new ObjectId(userId) });
        if (!pendingUser) {
          throw new Error("Pending user not found");
        }

        const generatedId = generateUserId(userType);
        const generatedPassword = generatePassword();

        const approvedUser = {
          id: generatedId,
          name: pendingUser.name,
          email: pendingUser.email,
          password: generatedPassword,
          ...(userType === "doctor" && {
            specialization: pendingUser.specialization,
            licenseNumber: pendingUser.licenseNumber,
          }),
          approvedAt: new Date(),
        };

        await approvedCollection.insertOne(approvedUser);
        await pendingCollection.deleteOne({ _id: new ObjectId(userId) });

        // Send credentials via email
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        if (resendApiKey) {
          const resend = new Resend(resendApiKey);
          try {
            await resend.emails.send({
              from: "Health Reports <onboarding@resend.dev>",
              to: [pendingUser.email],
              subject: "Your Account Has Been Approved - Login Credentials",
              html: `
                <h1>Welcome to Health Reports System!</h1>
                <p>Dear ${pendingUser.name},</p>
                <p>Your ${userType} account has been approved. Here are your login credentials:</p>
                <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>User ID:</strong> ${generatedId}</p>
                  <p><strong>Password:</strong> ${generatedPassword}</p>
                </div>
                <p>Please keep these credentials safe and do not share them with anyone.</p>
                <p>Best regards,<br>Health Reports Team</p>
              `,
            });
            console.log(`Credentials email sent to ${pendingUser.email}`);
          } catch (emailError) {
            console.error("Failed to send email:", emailError);
          }
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "User approved and credentials sent",
            userId: generatedId 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "reject": {
        if (!userId || !userType) {
          throw new Error("Missing userId or userType");
        }

        const collection = userType === "doctor" ? pendingDoctors : pendingPatients;
        await collection.deleteOne({ _id: new ObjectId(userId) });

        return new Response(
          JSON.stringify({ success: true, message: "Registration rejected" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "login": {
        if (!credentials) {
          throw new Error("Missing credentials");
        }

        // Check admin
        if (credentials.id.startsWith("ADMIN")) {
          const admin = await admins.findOne({ id: credentials.id, password: credentials.password });
          if (admin) {
            return new Response(
              JSON.stringify({ 
                success: true, 
                userType: "admin",
                user: { id: admin.id, name: admin.name }
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }

        // Check doctor
        if (credentials.id.startsWith("DOC")) {
          const doctor = await approvedDoctors.findOne({ id: credentials.id, password: credentials.password });
          if (doctor) {
            return new Response(
              JSON.stringify({ 
                success: true, 
                userType: "doctor",
                user: { 
                  id: doctor.id, 
                  name: doctor.name, 
                  email: doctor.email,
                  specialization: doctor.specialization,
                  licenseNumber: doctor.licenseNumber,
                  status: 'approved',
                  passwordChanged: doctor.passwordChanged || false
                }
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }

        // Check patient
        if (credentials.id.startsWith("PAT")) {
          const patient = await approvedPatients.findOne({ id: credentials.id, password: credentials.password });
          if (patient) {
            return new Response(
              JSON.stringify({ 
                success: true, 
                userType: "patient",
                user: { 
                  id: patient.id, 
                  name: patient.name, 
                  email: patient.email,
                  status: 'approved',
                  passwordChanged: patient.passwordChanged || false
                }
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }

        // Important: return 200 even for invalid credentials so the client can handle it
        // without treating it as a transport/runtime error.
        return new Response(
          JSON.stringify({ success: false, message: "Invalid credentials" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get-approved-doctors": {
        const doctors = await approvedDoctors.find({}).toArray();
        const formattedDoctors = doctors.map((d: any) => ({
          id: d.id,
          name: d.name,
          specialization: d.specialization,
          licenseNumber: d.licenseNumber,
        }));

        return new Response(
          JSON.stringify({ success: true, doctors: formattedDoctors }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "change-password": {
        if (!passwordData?.userId || !passwordData?.currentPassword || !passwordData?.newPassword) {
          throw new Error("Missing required password data");
        }

        const { userId, currentPassword, newPassword } = passwordData;

        // Determine user type from ID prefix
        let collection;
        let userTypeLabel;
        if (userId.startsWith("DOC")) {
          collection = approvedDoctors;
          userTypeLabel = "doctor";
        } else if (userId.startsWith("PAT")) {
          collection = approvedPatients;
          userTypeLabel = "patient";
        } else {
          throw new Error("Invalid user ID format");
        }

        // Find user and verify current password
        const user = await collection.findOne({ id: userId });
        if (!user) {
          return new Response(
            JSON.stringify({ success: false, message: "User not found" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (user.password !== currentPassword) {
          return new Response(
            JSON.stringify({ success: false, message: "Current password is incorrect" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Update password and mark as changed
        await collection.updateOne(
          { id: userId },
          { 
            $set: { 
              password: newPassword,
              passwordChanged: true,
              passwordChangedAt: new Date()
            } 
          }
        );

        console.log(`Password changed for ${userTypeLabel}: ${userId}`);

        return new Response(
          JSON.stringify({ success: true, message: "Password changed successfully" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error: any) {
    console.error("Error in mongodb-users function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
