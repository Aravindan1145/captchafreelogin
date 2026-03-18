import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { MongoClient, ObjectId } from "npm:mongodb@6.3.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ImageUploadRequest {
  action: 'upload' | 'get' | 'delete';
  reportId: string;
  imageData?: string;
  imageName?: string;
  imageId?: string;
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
  console.log("Connected to MongoDB for images");
  return cachedClient;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: ImageUploadRequest = await req.json();
    console.log('MongoDB Images API called with action:', body.action);

    const client = await getMongoClient();
    
    const db = client.db("health_reports");
    const imagesCollection = db.collection("report_images");

    let result;

    switch (body.action) {
      case 'upload':
        if (!body.imageData || !body.reportId) {
          throw new Error('Missing required fields: imageData and reportId');
        }
        
        const imageDoc = {
          reportId: body.reportId,
          imageName: body.imageName || `image_${Date.now()}`,
          imageData: body.imageData,
          createdAt: new Date(),
        };
        
        const insertResult = await imagesCollection.insertOne(imageDoc);
        console.log('Image uploaded successfully:', insertResult.insertedId);
        
        result = { 
          success: true, 
          imageId: insertResult.insertedId.toString(),
          message: 'Image uploaded successfully' 
        };
        break;

      case 'get':
        if (!body.reportId) {
          throw new Error('Missing required field: reportId');
        }
        
        const images = await imagesCollection.find({ reportId: body.reportId }).toArray();
        console.log(`Found ${images.length} images for report:`, body.reportId);
        
        result = { 
          success: true, 
          images: images.map(img => ({
            id: img._id.toString(),
            imageName: img.imageName,
            imageData: img.imageData,
            createdAt: img.createdAt,
          }))
        };
        break;

      case 'delete':
        if (!body.imageId) {
          throw new Error('Missing required field: imageId');
        }
        
        await imagesCollection.deleteOne({ _id: new ObjectId(body.imageId) });
        console.log('Image deleted:', body.imageId);
        
        result = { success: true, message: 'Image deleted successfully' };
        break;

      default:
        throw new Error('Invalid action. Use: upload, get, or delete');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('MongoDB Images API error:', error);
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
