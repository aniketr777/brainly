import { clerkClient } from "@clerk/express";

const auth = async (req, res, next) => {
  try {
    const { userId } = await req.auth();

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await clerkClient.users.getUser(userId);

    const hasPremiumPlan = user.privateMetadata?.plan === "premium";

    if (!hasPremiumPlan) {
      req.free_usage = user.privateMetadata?.free_usage ?? 0;
    } else {
      // reset free usage for premium users (optional)
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: 0,
        },
      });
      req.free_usage = 0;
    }

    req.plan = hasPremiumPlan ? "premium" : "free";

    next();
  } catch (e) {
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};
export default auth;