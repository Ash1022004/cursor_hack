import { httpRouter } from "convex/server";
import { httpAction, type ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

const http = httpRouter();

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

http.route({
  path: "/api/health",
  method: "GET",
  handler: httpAction(async () =>
    json({ ok: true, service: "sehat-saathi-convex" })
  ),
});

function getBearer(request: Request): string | null {
  const h = request.headers.get("Authorization");
  if (!h?.startsWith("Bearer ")) return null;
  return h.slice(7).trim() || null;
}

async function verifyAuth(ctx: ActionCtx, request: Request) {
  const token = getBearer(request);
  if (!token) return null;
  return (await ctx.runAction(internal.jwtNode.verifyJwt, {
    token,
  })) as { userId: string; email: string; role: string } | null;
}

function validateEmail(email: unknown): string | null {
  if (typeof email !== "string" || !email.trim()) return null;
  const e = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return null;
  return e;
}

// --- Auth: student login ---
http.route({
  path: "/api/auth/login",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return json(
        { success: false, message: "Invalid JSON" },
        400
      );
    }
    const email = validateEmail(body.email);
    const password = typeof body.password === "string" ? body.password : "";
    const errors: { msg: string; path: string }[] = [];
    if (!email) errors.push({ msg: "Valid email is required", path: "email" });
    if (!password.trim()) errors.push({ msg: "password is required", path: "password" });
    if (errors.length) {
      return json(
        { success: false, message: "Form validation error", errors },
        422
      );
    }
    if (email === null) {
      return json(
        {
          success: false,
          message: "Form validation error",
          errors: [{ msg: "Valid email is required", path: "email" }],
        },
        422
      );
    }
    const user = await ctx.runQuery(internal.users.getByEmail, { email });
    if (!user) {
      return json(
        {
          success: false,
          message:
            "No account found with this email. Please register to continue.",
        },
        404
      );
    }
    if (user.role !== "student") {
      return json({ success: false, message: "Invalid credentials" }, 400);
    }
    const ok = await ctx.runAction(internal.jwtNode.comparePassword, {
      password,
      passwordHash: user.passwordHash,
    });
    if (!ok) {
      return json({ success: false, message: "Invalid credentials" }, 400);
    }
    const { passwordHash: _p, ...safe } = user;
    const token = await ctx.runAction(internal.jwtNode.signJwt, {
      userId: user._id,
      email: user.email,
      role: user.role,
    });
    return json({
      success: true,
      message: "User login successfully",
      user: safe,
      token,
    });
  }),
});

// --- Auth: counsellor login ---
http.route({
  path: "/api/auth/login/counsellor",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return json({ success: false, message: "Invalid JSON" }, 400);
    }
    const email = validateEmail(body.email);
    const password = typeof body.password === "string" ? body.password : "";
    const errors: { msg: string; path: string }[] = [];
    if (!email) errors.push({ msg: "Valid email is required", path: "email" });
    if (!password.trim()) errors.push({ msg: "password is required", path: "password" });
    if (errors.length) {
      return json(
        { success: false, message: "Form validation error", errors },
        422
      );
    }
    if (email === null) {
      return json(
        {
          success: false,
          message: "Form validation error",
          errors: [{ msg: "Valid email is required", path: "email" }],
        },
        422
      );
    }
    const user = await ctx.runQuery(internal.users.getByEmail, { email });
    if (!user || user.role !== "counsellor") {
      return json(
        {
          success: false,
          message: "No counsellor account found with this email.",
        },
        404
      );
    }
    const pwOk = await ctx.runAction(internal.jwtNode.comparePassword, {
      password,
      passwordHash: user.passwordHash,
    });
    if (!pwOk) {
      return json({ success: false, message: "Invalid credentials" }, 400);
    }
    const { passwordHash: _p, ...safe } = user;
    const token = await ctx.runAction(internal.jwtNode.signJwt, {
      userId: user._id,
      email: user.email,
      role: "counsellor",
    });
    return json({
      success: true,
      message: "Counsellor login successfully",
      user: safe,
      token,
    });
  }),
});

// --- Auth: admin login ---
http.route({
  path: "/api/auth/login/admin",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return json({ success: false, message: "Invalid JSON" }, 400);
    }
    const email = validateEmail(body.email);
    const password = typeof body.password === "string" ? body.password : "";
    const errors: { msg: string; path: string }[] = [];
    if (!email) errors.push({ msg: "Valid email is required", path: "email" });
    if (!password.trim()) errors.push({ msg: "password is required", path: "password" });
    if (errors.length) {
      return json(
        { success: false, message: "Form validation error", errors },
        422
      );
    }
    if (email === null) {
      return json(
        {
          success: false,
          message: "Form validation error",
          errors: [{ msg: "Valid email is required", path: "email" }],
        },
        422
      );
    }
    const user = await ctx.runQuery(internal.users.getByEmail, { email });
    if (!user || user.role !== "admin") {
      return json(
        { success: false, message: "No admin account found with this email." },
        404
      );
    }
    const pwOk = await ctx.runAction(internal.jwtNode.comparePassword, {
      password,
      passwordHash: user.passwordHash,
    });
    if (!pwOk) {
      return json({ success: false, message: "Invalid credentials" }, 400);
    }
    const { passwordHash: _p, ...safe } = user;
    const token = await ctx.runAction(internal.jwtNode.signJwt, {
      userId: user._id,
      email: user.email,
      role: "admin",
    });
    return json({
      success: true,
      message: "Admin login successfully",
      user: safe,
      token,
    });
  }),
});

// --- Auth: sign up (student) ---
http.route({
  path: "/api/auth/signUp",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return json({ success: false, message: "Invalid JSON" }, 400);
    }
    try {
      const errors: { msg: string; path: string }[] = [];
      const firstName =
        typeof body.firstName === "string" ? body.firstName.trim() : "";
      const lastName =
        typeof body.lastName === "string" ? body.lastName.trim() : "";
      const university =
        typeof body.university === "string" ? body.university.trim() : "";
      const program =
        typeof body.program === "string" ? body.program.trim() : "";
      const email = validateEmail(body.email);
      const password = typeof body.password === "string" ? body.password : "";
      if (!firstName)
        errors.push({ msg: "First name is required", path: "firstName" });
      if (!lastName)
        errors.push({ msg: "Last name is required", path: "lastName" });
      if (!university)
        errors.push({ msg: "University is required", path: "university" });
      if (!program)
        errors.push({ msg: "Program is required", path: "program" });
      if (!email)
        errors.push({ msg: "Valid email is required", path: "email" });
      if (!password.trim())
        errors.push({ msg: "password is required", path: "password" });
      if (errors.length) {
        return json(
          { success: false, message: "Field is required", errors },
          400
        );
      }
      const contactNo = Number(body.contactNo);
      if (Number.isNaN(contactNo)) {
        return json(
          { success: false, message: "Contact number must be valid" },
          400
        );
      }
      const passwordHash = await ctx.runAction(internal.jwtNode.hashPassword, {
        password,
      });
      const result = await ctx.runMutation(internal.users.createStudent, {
        email: email!,
        passwordHash,
        firstName,
        lastName,
        contactNo,
        university,
        program,
        branch:
          typeof body.branch === "string" ? body.branch.trim() : undefined,
        semester:
          typeof body.semester === "string" ? body.semester.trim() : undefined,
      });
      if (!result.ok) {
        return json(
          {
            success: false,
            message: "User already exists. Please login to continue.",
          },
          400
        );
      }
      return json({
        success: true,
        message: "User registered successfully",
        user: result.user,
      });
    } catch (e) {
      console.error("[http signUp]", e);
      const message =
        e instanceof Error ? e.message : "Registration failed unexpectedly";
      return json({ success: false, message }, 500);
    }
  }),
});

// --- Auth: logout (stateless JWT — client clears storage) ---
http.route({
  path: "/api/auth/logout",
  method: "POST",
  handler: httpAction(async () => {
    return json({ success: true, message: "Logged out successfully" });
  }),
});

// --- Sticky notes ---
http.route({
  path: "/api/sticky-notes",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const auth = await verifyAuth(ctx, request);
    if (!auth) {
      return json({ success: false, message: "Unauthorized" }, 401);
    }
    const data = await ctx.runQuery(internal.stickyNotes.listForUser, {
      userId: auth.userId as Id<"users">,
    });
    return json({ success: true, data });
  }),
});

http.route({
  path: "/api/sticky-notes",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const auth = await verifyAuth(ctx, request);
    if (!auth) {
      return json({ success: false, message: "Unauthorized" }, 401);
    }
    let body: Record<string, unknown> = {};
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      body = {};
    }
    const result = await ctx.runMutation(internal.stickyNotes.createForUser, {
      userId: auth.userId as Id<"users">,
      content: body.content as string | undefined,
      color: body.color as string | undefined,
      position: body.position as
        | { x: number; y: number }
        | undefined,
      size: body.size as
        | { width: number; height: number }
        | undefined,
    });
    if (!result.ok) {
      return json(
        { success: false, message: "Maximum 10 sticky notes allowed per user" },
        400
      );
    }
    return json({ success: true, data: result.data }, 201);
  }),
});

http.route({
  pathPrefix: "/api/sticky-notes/",
  method: "PUT",
  handler: httpAction(async (ctx, request) => {
    const auth = await verifyAuth(ctx, request);
    if (!auth) {
      return json({ success: false, message: "Unauthorized" }, 401);
    }
    const path = new URL(request.url).pathname;
    const rest = path.slice("/api/sticky-notes/".length);
    const bringToFront = rest.endsWith("/bring-to-front");
    const idStr = bringToFront
      ? rest.slice(0, -"/bring-to-front".length)
      : rest;
    if (!idStr) return json({ success: false, message: "Not found" }, 404);
    let body: Record<string, unknown> = {};
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      body = {};
    }
    if (bringToFront) {
      const result = await ctx.runMutation(
        internal.stickyNotes.bringToFrontForUser,
        {
          userId: auth.userId as Id<"users">,
          noteId: idStr as Id<"stickyNotes">,
        }
      );
      if (!result.ok) {
        return json({ success: false, message: "Sticky note not found" }, 404);
      }
      return json({ success: true, data: result.data });
    }
    const result = await ctx.runMutation(internal.stickyNotes.updateForUser, {
      userId: auth.userId as Id<"users">,
      noteId: idStr as Id<"stickyNotes">,
      patch: body,
    });
    if (!result.ok) {
      return json({ success: false, message: "Sticky note not found" }, 404);
    }
    return json({ success: true, data: result.data });
  }),
});

http.route({
  pathPrefix: "/api/sticky-notes/",
  method: "DELETE",
  handler: httpAction(async (ctx, request) => {
    const auth = await verifyAuth(ctx, request);
    if (!auth) {
      return json({ success: false, message: "Unauthorized" }, 401);
    }
    const path = new URL(request.url).pathname;
    const idStr = path.slice("/api/sticky-notes/".length);
    if (!idStr || idStr.includes("/")) {
      return json({ success: false, message: "Not found" }, 404);
    }
    const result = await ctx.runMutation(
      internal.stickyNotes.softDeleteForUser,
      {
        userId: auth.userId as Id<"users">,
        noteId: idStr as Id<"stickyNotes">,
      }
    );
    if (!result.ok) {
      return json({ success: false, message: "Sticky note not found" }, 404);
    }
    return json({
      success: true,
      message: "Sticky note deleted successfully",
    });
  }),
});

// --- User chat AI ---
http.route({
  path: "/api/user/chat/ai",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const auth = await verifyAuth(ctx, request);
    if (!auth) {
      return json({ message: "No token Provided" }, 401);
    }
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return json({ error: "message is required" }, 400);
    }
    const message =
      typeof body.message === "string" ? body.message : "";
    if (!message) {
      return json({ error: "message is required" }, 400);
    }
    const anonymousId = `jwt:${auth.userId}`;
    const sessionIdRaw = body.sessionId;
    const sessionId =
      typeof sessionIdRaw === "string" && sessionIdRaw.length > 0
        ? (sessionIdRaw as Id<"sessions">)
        : undefined;
    try {
      const data = await ctx.runAction(internal.patientChat.runTurn, {
        anonymousId,
        sessionId,
        message,
      });
      return json({
        reply: data.reply,
        response: data.response,
        agentType: data.agentType,
        sessionId: data.sessionId,
        crisisDetected: data.crisisDetected,
        suggestions: data.suggestions,
      });
    } catch {
      return json({ error: "Failed to get AI response" }, 500);
    }
  }),
});

// --- Chatbot health ---
http.route({
  path: "/api/chatbot/health",
  method: "GET",
  handler: httpAction(async (ctx) => {
    try {
      const r = await ctx.runAction(internal.chatbotNode.chatbotHealth, {});
      return json({
        ok: Boolean(r?.ok),
        providers: r,
      });
    } catch (e) {
      return json(
        {
          ok: false,
          error: e instanceof Error ? e.message : "LLM not configured",
        },
        500
      );
    }
  }),
});

// --- Counsellor ---
http.route({
  path: "/api/counsellor/getUser",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const auth = await verifyAuth(ctx, request);
    if (!auth) {
      return json({ message: "No token Provided" }, 401);
    }
    if (auth.role !== "counsellor") {
      return json({ success: false, message: "Unauthorized" }, 403);
    }
    return new Response("get assigned user/student", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }),
});

// --- Admin: users ---
http.route({
  path: "/api/admin/user",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const auth = await verifyAuth(ctx, request);
    if (!auth) {
      return json({ success: false, message: "No token Provided" }, 401);
    }
    if (auth.role !== "admin") {
      return json({ message: "Access denied: Admins only" }, 403);
    }
    const users = await ctx.runQuery(internal.users.listStudents, {});
    return json({
      success: true,
      message: "All users fetched successfully",
      users,
    });
  }),
});

http.route({
  pathPrefix: "/api/admin/user/",
  method: "PUT",
  handler: httpAction(async (ctx, request) => {
    const auth = await verifyAuth(ctx, request);
    if (!auth) {
      return json({ success: false, message: "No token Provided" }, 401);
    }
    if (auth.role !== "admin") {
      return json({ message: "Access denied: Admins only" }, 403);
    }
    const path = new URL(request.url).pathname;
    const idStr = path.slice("/api/admin/user/".length);
    if (!idStr) return json({ message: "User not found" }, 404);
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      body = {};
    }
    let patch = { ...body };
    if (typeof body.password === "string" && body.password.length > 0) {
      const passwordHash = await ctx.runAction(internal.jwtNode.hashPassword, {
        password: body.password as string,
      });
      patch = { ...body, passwordHash };
      delete patch.password;
    }
    const result = await ctx.runMutation(internal.users.updateStudent, {
      userId: idStr as Id<"users">,
      patch,
    });
    if (!result.ok) {
      return json({ message: "User not found" }, 404);
    }
    return json({
      success: true,
      message: "User updated successfully",
      user: result.user,
    });
  }),
});

http.route({
  pathPrefix: "/api/admin/user/",
  method: "DELETE",
  handler: httpAction(async (ctx, request) => {
    const auth = await verifyAuth(ctx, request);
    if (!auth) {
      return json({ success: false, message: "No token Provided" }, 401);
    }
    if (auth.role !== "admin") {
      return json({ message: "Access denied: Admins only" }, 403);
    }
    const path = new URL(request.url).pathname;
    const idStr = path.slice("/api/admin/user/".length);
    if (!idStr) return json({ message: "User not found" }, 404);
    const result = await ctx.runMutation(internal.users.deleteStudent, {
      userId: idStr as Id<"users">,
    });
    if (!result.ok) {
      return json({ message: "User not found" }, 404);
    }
    return json({
      success: true,
      msg: "User deleted successfully",
    });
  }),
});

// --- Admin: counsellors ---
http.route({
  path: "/api/admin/counsellor",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const auth = await verifyAuth(ctx, request);
    if (!auth) {
      return json({ success: false, message: "No token Provided" }, 401);
    }
    if (auth.role !== "admin") {
      return json({ message: "Access denied: Admins only" }, 403);
    }
    const counsellors = await ctx.runQuery(internal.users.listCounsellors, {});
    return json({
      success: true,
      message: "All counsellors fetched successfully",
      counsellors,
    });
  }),
});

http.route({
  path: "/api/admin/counsellor",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const auth = await verifyAuth(ctx, request);
    if (!auth) {
      return json({ success: false, message: "No token Provided" }, 401);
    }
    if (auth.role !== "admin") {
      return json({ message: "Access denied: Admins only" }, 403);
    }
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return json({ success: false, message: "Invalid JSON" }, 400);
    }
    const errors: { msg: string; path: string }[] = [];
    const firstName =
      typeof body.firstName === "string" ? body.firstName.trim() : "";
    const lastName =
      typeof body.lastName === "string" ? body.lastName.trim() : "";
    const email = validateEmail(body.email);
    const password = typeof body.password === "string" ? body.password : "";
    const qualifications =
      typeof body.qualifications === "string"
        ? body.qualifications.trim()
        : "";
    const contactRaw = body.contactNo;
    const contactNo =
      typeof contactRaw === "number"
        ? contactRaw
        : typeof contactRaw === "string"
          ? Number(contactRaw)
          : NaN;
    const availability = body.availability;
    const hasAvail =
      (typeof availability === "string" && availability.trim()) ||
      (Array.isArray(availability) && availability.length > 0);
    if (!firstName) errors.push({ msg: "First name is required", path: "firstName" });
    if (!lastName) errors.push({ msg: "Last name is required", path: "lastName" });
    if (Number.isNaN(contactNo)) {
      errors.push({ msg: "Contact number is required", path: "contactNo" });
    }
    if (!email) errors.push({ msg: "Valid email is required", path: "email" });
    if (!password.trim()) errors.push({ msg: "Password is required", path: "password" });
    if (!qualifications) {
      errors.push({ msg: "Qualifications are required", path: "qualifications" });
    }
    if (!hasAvail) {
      errors.push({ msg: "Availability is required", path: "availability" });
    }
    if (errors.length) {
      return json(
        { success: false, message: "Field is required", errors },
        400
      );
    }
    const specialization = Array.isArray(body.specialization)
      ? (body.specialization as string[])
      : undefined;
    const passwordHash = await ctx.runAction(internal.jwtNode.hashPassword, {
      password,
    });
    const availNormalized =
      Array.isArray(availability) ? availability : String(availability);
    const result = await ctx.runMutation(internal.users.createCounsellor, {
      email: email!,
      passwordHash,
      firstName,
      lastName,
      contactNo,
      qualifications,
      specialization,
      availability: availNormalized,
    });
    if (!result.ok) {
      return json({ success: false, message: "Email already exists" }, 400);
    }
    return json({
      success: true,
      message: "Counsellor created successfully",
      counsellor: result.counsellor,
    });
  }),
});

http.route({
  pathPrefix: "/api/admin/counsellor/",
  method: "PUT",
  handler: httpAction(async (ctx, request) => {
    const auth = await verifyAuth(ctx, request);
    if (!auth) {
      return json({ success: false, message: "No token Provided" }, 401);
    }
    if (auth.role !== "admin") {
      return json({ message: "Access denied: Admins only" }, 403);
    }
    const path = new URL(request.url).pathname;
    const idStr = path.slice("/api/admin/counsellor/".length);
    if (!idStr) {
      return json({ success: false, message: "Counsellor not found" }, 404);
    }
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      body = {};
    }
    let patch = { ...body };
    if (typeof body.password === "string" && body.password.length > 0) {
      const passwordHash = await ctx.runAction(internal.jwtNode.hashPassword, {
        password: body.password as string,
      });
      patch = { ...body, passwordHash };
      delete patch.password;
    }
    const result = await ctx.runMutation(internal.users.updateCounsellor, {
      counsellorId: idStr as Id<"users">,
      patch,
    });
    if (!result.ok) {
      return json({ success: false, message: "Counsellor not found" }, 404);
    }
    return json({
      success: true,
      message: "Counsellor updated successfully",
      counsellor: result.counsellor,
    });
  }),
});

http.route({
  pathPrefix: "/api/admin/counsellor/",
  method: "DELETE",
  handler: httpAction(async (ctx, request) => {
    const auth = await verifyAuth(ctx, request);
    if (!auth) {
      return json({ success: false, message: "No token Provided" }, 401);
    }
    if (auth.role !== "admin") {
      return json({ message: "Access denied: Admins only" }, 403);
    }
    const path = new URL(request.url).pathname;
    const idStr = path.slice("/api/admin/counsellor/".length);
    if (!idStr) {
      return json({ success: false, message: "Counsellor not found" }, 404);
    }
    const result = await ctx.runMutation(internal.users.deleteCounsellor, {
      counsellorId: idStr as Id<"users">,
    });
    if (!result.ok) {
      return json({ success: false, message: "Counsellor not found" }, 404);
    }
    return json({
      success: true,
      message: "Counsellor deleted successfully",
    });
  }),
});

// --- User routes: peer / counsellor stubs ---
http.route({
  path: "/api/user/chat/peer-to-peer",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const auth = await verifyAuth(ctx, request);
    if (!auth) {
      return json({ message: "No token Provided" }, 401);
    }
    return new Response("peer to peer chat", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }),
});

http.route({
  path: "/api/user/chat/counsellor",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const auth = await verifyAuth(ctx, request);
    if (!auth) {
      return json({ message: "No token Provided" }, 401);
    }
    return new Response("chat with counsellor", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }),
});

// --- Health tools: hospitals from Apify (uses APIFY_TOKEN on Convex) ---
http.route({
  path: "/api/apify/hospitals",
  method: "GET",
  handler: httpAction(async (ctx) => {
    try {
      const hospitals = await ctx.runAction(
        internal.hospitalsNode.fetchApifyHospitals,
        {}
      );
      return json({ hospitals });
    } catch (e) {
      console.error("[http /api/apify/hospitals]", e);
      return json({ hospitals: [] });
    }
  }),
});

export default http;
