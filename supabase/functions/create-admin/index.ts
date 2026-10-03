import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    const adminEmail = "admin@pujaconnect.in";
    const existing = existingUsers.users.find((u: { email: string }) => u.email === adminEmail);

    if (existing) {
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", existing.id)
        .maybeSingle();

      if (existingProfile) {
        return new Response(
          JSON.stringify({ message: "Admin user already exists", email: adminEmail }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .insert({ id: existing.id, full_name: "Platform Admin", role: "admin" });
      if (profileError) throw profileError;

      return new Response(
        JSON.stringify({ message: "Admin profile created for existing user", email: adminEmail }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const initialAdminPassword = Deno.env.get("ADMIN_INITIAL_PASSWORD");
    if (!initialAdminPassword) {
      throw new Error("ADMIN_INITIAL_PASSWORD must be configured before creating the admin user");
    }

    const { data: authData, error: createError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: initialAdminPassword,
      email_confirm: true,
      user_metadata: { full_name: "Platform Admin", role: "admin" },
    });
    if (createError) throw createError;

    const { error: profileError } = await supabase
      .from("profiles")
      .insert({ id: authData.user.id, full_name: "Platform Admin", role: "admin" });
    if (profileError) throw profileError;

    return new Response(
      JSON.stringify({ message: "Admin user created successfully", email: adminEmail }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
