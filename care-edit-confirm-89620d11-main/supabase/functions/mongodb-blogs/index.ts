import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { MongoClient, ObjectId } from "npm:mongodb@6.3.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface BlogRequest {
  action: "create" | "update" | "delete" | "get-all" | "get-by-doctor" | "like" | "unlike";
  blogData?: {
    id?: string;
    doctorId: string;
    doctorName: string;
    title: string;
    content: string;
    imageUrl?: string;
    category: string;
    isPublished: boolean;
  };
  blogId?: string;
  doctorId?: string;
  userId?: string;
}

let cachedClient: MongoClient | null = null;

async function getMongoClient(): Promise<MongoClient> {
  if (cachedClient) {
    return cachedClient;
  }

  const mongoUri = Deno.env.get("MONGODB_URI");
  if (!mongoUri) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  const client = new MongoClient(mongoUri);
  await client.connect();
  cachedClient = client;
  
  console.log("Connected to MongoDB for blogs");
  return client;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const client = await getMongoClient();
    const db = client.db("health_reports");
    const blogsCollection = db.collection("blogs");

    const { action, blogData, blogId, doctorId, userId }: BlogRequest = await req.json();
    console.log(`Processing blog action: ${action}`);

    switch (action) {
      case "create": {
        if (!blogData) {
          throw new Error("Blog data is required");
        }

        const newBlog = {
          doctorId: blogData.doctorId,
          doctorName: blogData.doctorName,
          title: blogData.title,
          content: blogData.content,
          imageUrl: blogData.imageUrl || null,
          category: blogData.category,
          isPublished: blogData.isPublished,
          publishedAt: blogData.isPublished ? new Date().toISOString() : null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          likes: [],
        };

        const result = await blogsCollection.insertOne(newBlog);
        console.log(`Blog created with id: ${result.insertedId}`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            blog: { ...newBlog, id: result.insertedId.toString() }
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update": {
        if (!blogId || !blogData) {
          throw new Error("Blog ID and data are required");
        }

        const updateData = {
          title: blogData.title,
          content: blogData.content,
          imageUrl: blogData.imageUrl || null,
          category: blogData.category,
          isPublished: blogData.isPublished,
          updatedAt: new Date().toISOString(),
        };

        // If publishing for the first time, set publishedAt
        const existingBlog = await blogsCollection.findOne({ _id: new ObjectId(blogId) });
        if (blogData.isPublished && existingBlog && !existingBlog.publishedAt) {
          (updateData as any).publishedAt = new Date().toISOString();
        }

        await blogsCollection.updateOne(
          { _id: new ObjectId(blogId) },
          { $set: updateData }
        );

        console.log(`Blog updated: ${blogId}`);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "delete": {
        if (!blogId) {
          throw new Error("Blog ID is required");
        }

        await blogsCollection.deleteOne({ _id: new ObjectId(blogId) });
        console.log(`Blog deleted: ${blogId}`);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get-all": {
        // Get all published blogs for patients
        const blogs = await blogsCollection
          .find({ isPublished: true })
          .sort({ publishedAt: -1 })
          .toArray();

        const formattedBlogs = blogs.map((blog) => ({
          id: blog._id.toString(),
          doctorId: blog.doctorId,
          doctorName: blog.doctorName,
          title: blog.title,
          content: blog.content,
          imageUrl: blog.imageUrl,
          category: blog.category,
          publishedAt: blog.publishedAt,
          createdAt: blog.createdAt,
          updatedAt: blog.updatedAt,
          likes: blog.likes || [],
          isPublished: blog.isPublished,
        }));

        return new Response(
          JSON.stringify({ success: true, blogs: formattedBlogs }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get-by-doctor": {
        if (!doctorId) {
          throw new Error("Doctor ID is required");
        }

        // Get all blogs by a specific doctor (including drafts)
        const blogs = await blogsCollection
          .find({ doctorId })
          .sort({ createdAt: -1 })
          .toArray();

        const formattedBlogs = blogs.map((blog) => ({
          id: blog._id.toString(),
          doctorId: blog.doctorId,
          doctorName: blog.doctorName,
          title: blog.title,
          content: blog.content,
          imageUrl: blog.imageUrl,
          category: blog.category,
          publishedAt: blog.publishedAt,
          createdAt: blog.createdAt,
          updatedAt: blog.updatedAt,
          likes: blog.likes || [],
          isPublished: blog.isPublished,
        }));

        return new Response(
          JSON.stringify({ success: true, blogs: formattedBlogs }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "like": {
        if (!blogId || !userId) {
          throw new Error("Blog ID and User ID are required");
        }

        // Add user to likes array if not already liked
        await blogsCollection.updateOne(
          { _id: new ObjectId(blogId) },
          { $addToSet: { likes: userId } }
        );

        console.log(`Blog ${blogId} liked by ${userId}`);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "unlike": {
        if (!blogId || !userId) {
          throw new Error("Blog ID and User ID are required");
        }

        // Remove user from likes array
        await blogsCollection.updateOne(
          { _id: new ObjectId(blogId) },
          { $pull: { likes: userId } }
        );

        console.log(`Blog ${blogId} unliked by ${userId}`);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error: any) {
    console.error("Error in mongodb-blogs function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
