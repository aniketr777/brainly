import { clerkClient } from "@clerk/express";
import toast from "react-hot-toast";
const auth = async (req, res, next) => {
  try {
    const { userId } = req.auth();

    if (!userId) {
      toast.error("Please Login");
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await clerkClient.users.getUser(userId);

    const hasPremiumPlan = user.privateMetadata?.plan === "premium";

    if (!hasPremiumPlan) {
      req.free_usage = user.privateMetadata?.free_usage ?? 0;
    } else {
      // optional: reset free usage only if needed
      if (user.privateMetadata?.free_usage !== 0) {
        await clerkClient.users.updateUserMetadata(userId, {
          privateMetadata: { free_usage: 0 },
        });
      }
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
