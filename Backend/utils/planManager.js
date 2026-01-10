import { clerkClient } from "@clerk/express";
import { ForbiddenError } from "./errors.js";

const FREE_PLAN_LIMIT = 3;

/**
 * Check if user has reached their plan limit
 * @param {string} userId - User ID
 * @param {string} plan - User plan (premium/free)
 * @param {number} freeUsage - Current free usage count
 * @returns {Promise<{allowed: boolean, message?: string}>}
 */
export const checkUserPlan = async (userId, plan, freeUsage) => {
  if (plan !== "premium" && freeUsage >= FREE_PLAN_LIMIT) {
    return {
      allowed: false,
      message: "Free limit reached. Upgrade to continue.",
    };
  }
  return { allowed: true };
};

/**
 * Increment user's free usage count
 * @param {string} userId - User ID
 * @param {string} plan - User plan
 * @param {number} freeUsage - Current free usage count
 */
export const incrementUsage = async (userId, plan, freeUsage) => {
  if (plan !== "premium") {
    await clerkClient.users.updateUser(userId, {
      privateMetadata: { free_usage: (freeUsage || 0) + 1 },
    });
  }
};

/**
 * Decrement user's free usage count
 * @param {string} userId - User ID
 * @param {string} plan - User plan
 * @param {number} freeUsage - Current free usage count
 */
export const decrementUsage = async (userId, plan, freeUsage) => {
  if (plan !== "premium" && freeUsage > 0) {
    await clerkClient.users.updateUser(userId, {
      privateMetadata: { free_usage: freeUsage - 1 },
    });
  }
};

/**
 * Validate user plan and throw error if limit reached
 * @param {string} userId - User ID
 * @param {string} plan - User plan
 * @param {number} freeUsage - Current free usage count
 * @throws {ForbiddenError} If plan limit reached
 */
export const validateUserPlan = async (userId, plan, freeUsage) => {
  const planCheck = await checkUserPlan(userId, plan, freeUsage);
  if (!planCheck.allowed) {
    throw new ForbiddenError(planCheck.message);
  }
};
