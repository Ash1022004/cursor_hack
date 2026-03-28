import type { HttpRouter } from "convex/server";
import { httpAction } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { json, validateEmail } from "../common";

export function registerAuthRoutes(http: HttpRouter): void {
  http.route({
    path: "/api/auth/login",
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
      if (!password.trim())
        errors.push({ msg: "password is required", path: "password" });
      if (errors.length) {
        return json(
          { success: false, message: "Form validation error", errors },
          422
        );
      }
      const user = await ctx.runQuery(internal.users.getByEmail, { email: email! });
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
      if (!password.trim())
        errors.push({ msg: "password is required", path: "password" });
      if (errors.length) {
        return json(
          { success: false, message: "Form validation error", errors },
          422
        );
      }
      const user = await ctx.runQuery(internal.users.getByEmail, { email: email! });
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
      if (!password.trim())
        errors.push({ msg: "password is required", path: "password" });
      if (errors.length) {
        return json(
          { success: false, message: "Form validation error", errors },
          422
        );
      }
      const user = await ctx.runQuery(internal.users.getByEmail, { email: email! });
      if (!user || user.role !== "admin") {
        return json(
          {
            success: false,
            message: "No admin account found with this email.",
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

  http.route({
    path: "/api/auth/signUp/counsellor",
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
        const qualifications =
          typeof body.qualifications === "string" ? body.qualifications.trim() : "";
        const email = validateEmail(body.email);
        const password = typeof body.password === "string" ? body.password : "";
        const availability =
          typeof body.availability === "string" ? body.availability.trim() : "";
        if (!firstName)
          errors.push({ msg: "First name is required", path: "firstName" });
        if (!lastName)
          errors.push({ msg: "Last name is required", path: "lastName" });
        if (!qualifications)
          errors.push({ msg: "Qualifications are required", path: "qualifications" });
        if (!email)
          errors.push({ msg: "Valid email is required", path: "email" });
        if (!password.trim())
          errors.push({ msg: "Password is required", path: "password" });
        if (!availability)
          errors.push({ msg: "Availability is required", path: "availability" });
        if (errors.length) {
          return json(
            { success: false, message: "Validation error", errors },
            422
          );
        }
        const contactNo = Number(body.contactNo);
        if (Number.isNaN(contactNo)) {
          return json(
            { success: false, message: "Contact number must be valid" },
            400
          );
        }
        const specialization = Array.isArray(body.specialization)
          ? (body.specialization as string[]).map((s) =>
              typeof s === "string" ? s.trim() : ""
            ).filter(Boolean)
          : [];
        const passwordHash = await ctx.runAction(internal.jwtNode.hashPassword, {
          password,
        });
        const result = await ctx.runMutation(internal.users.createCounsellor, {
          email: email!,
          passwordHash,
          firstName,
          lastName,
          contactNo,
          qualifications,
          specialization,
          availability,
        });
        if (!result.ok) {
          return json(
            {
              success: false,
              message: "An account with this email already exists.",
            },
            400
          );
        }
        return json({
          success: true,
          message: "Counsellor registered successfully",
          counsellor: result.counsellor,
        });
      } catch (e) {
        console.error("[http signUp/counsellor]", e);
        const message =
          e instanceof Error ? e.message : "Registration failed unexpectedly";
        return json({ success: false, message }, 500);
      }
    }),
  });

  http.route({
    path: "/api/auth/logout",
    method: "POST",
    handler: httpAction(async () => {
      return json({ success: true, message: "Logged out successfully" });
    }),
  });
}
