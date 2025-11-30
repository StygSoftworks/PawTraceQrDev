import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ADMIN_EMAIL = "collin@stygiansoftworks.com";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { name, email, phone, subject, message, user_id } = await req.json();

    if (!name || !email || !subject || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: messageData, error: dbError } = await supabase
      .from("contact_messages")
      .insert({
        user_id: user_id || null,
        name,
        email,
        phone: phone || null,
        subject,
        message,
        status: "pending",
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return new Response(
        JSON.stringify({ error: "Failed to save message" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const emailBody = `
New Contact Form Submission
============================

Reference ID: ${messageData.id}

From: ${name}
Email: ${email}
${phone ? `Phone: ${phone}\n` : ""}Subject: ${subject}
${user_id ? `User ID: ${user_id}\n` : "Anonymous User\n"}
Submitted: ${new Date(messageData.created_at).toLocaleString()}

Message:
--------
${message}

============================
Reply to this email to respond to the user.
    `;

    console.log("Contact form submission received:", {
      id: messageData.id,
      name,
      email,
      subject,
    });

    console.log("Email would be sent to:", ADMIN_EMAIL);
    console.log("Email body:", emailBody);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Contact message received",
        id: messageData.id,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error processing contact form:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
